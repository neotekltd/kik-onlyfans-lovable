import Stripe from 'stripe';
import { Request, Response, NextFunction } from 'express';
import { db } from './database';
import { 
  user_subscriptions, 
  tips, 
  creator_profiles, 
  profiles, 
  posts,
  payment_intents,
  creator_payouts,
  messages
} from './schema';
import { eq, and, gte, lte, sum, count, desc } from 'drizzle-orm';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// Webhook endpoint secret for verifying Stripe webhooks
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Platform fee percentage (5%)
const PLATFORM_FEE_PERCENTAGE = 0.05;

// Payment processing interfaces
interface CreatePaymentIntentRequest {
  type: 'subscription' | 'tip' | 'ppv' | 'live_stream';
  amount: number;
  creatorId: string;
  userId: string;
  contentId?: string;
  subscriptionTier?: 'monthly' | 'quarterly' | 'yearly';
  tipMessage?: string;
  description?: string;
}

interface ConfirmPaymentRequest {
  paymentIntentId: string;
  type: 'subscription' | 'tip' | 'ppv' | 'live_stream';
  amount: number;
  creatorId: string;
  userId: string;
  contentId?: string;
  tipMessage?: string;
}

interface CreatorOnboardingRequest {
  creatorId: string;
  businessType: 'individual' | 'company';
  country: string;
  email: string;
  phone?: string;
}

// Create payment intent
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { 
      type, 
      amount, 
      creatorId, 
      userId, 
      contentId, 
      subscriptionTier = 'monthly',
      tipMessage,
      description 
    }: CreatePaymentIntentRequest = req.body;

    // Validate required fields
    if (!type || !amount || !creatorId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate amount (minimum $1, maximum $10,000)
    if (amount < 100 || amount > 1000000) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    // Get creator information
    const [creator] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, creatorId))
      .limit(1);

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Calculate final amount based on subscription tier
    let finalAmount = amount;
    if (type === 'subscription' && subscriptionTier !== 'monthly') {
      if (subscriptionTier === 'quarterly') {
        finalAmount = Math.floor(amount * 2.7); // 10% discount
      } else if (subscriptionTier === 'yearly') {
        finalAmount = amount * 10; // 17% discount (12 months for price of 10)
      }
    }

    // Calculate platform fee
    const platformFee = Math.floor(finalAmount * PLATFORM_FEE_PERCENTAGE);

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: 'usd',
      application_fee_amount: platformFee,
      transfer_data: {
        destination: creator.stripe_account_id || '', // Creator's connected account
      },
      metadata: {
        type,
        creatorId,
        userId,
        contentId: contentId || '',
        subscriptionTier,
        tipMessage: tipMessage || '',
        description: description || ''
      }
    });

    // Store payment intent in database
    await db.insert(payment_intents).values({
      id: paymentIntent.id,
      user_id: userId,
      creator_id: creatorId,
      amount: finalAmount,
      platform_fee: platformFee,
      type,
      status: 'pending',
      stripe_payment_intent_id: paymentIntent.id,
      content_id: contentId,
      subscription_tier: subscriptionTier,
      tip_message: tipMessage,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.json({ 
      client_secret: paymentIntent.client_secret,
      amount: finalAmount,
      platform_fee: platformFee
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

// Confirm payment and process business logic
export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const {
      paymentIntentId,
      type,
      amount,
      creatorId,
      userId,
      contentId,
      tipMessage
    }: ConfirmPaymentRequest = req.body;

    // Update payment intent status
    await db
      .update(payment_intents)
      .set({ 
        status: 'succeeded',
        updated_at: new Date()
      })
      .where(eq(payment_intents.stripe_payment_intent_id, paymentIntentId));

    // Process based on payment type
    switch (type) {
      case 'subscription':
        await processSubscriptionPayment(userId, creatorId, amount);
        break;
      
      case 'tip':
        await processTipPayment(userId, creatorId, amount, tipMessage);
        break;
      
      case 'ppv':
        await processPPVPayment(userId, creatorId, contentId!, amount);
        break;
      
      case 'live_stream':
        await processLiveStreamPayment(userId, creatorId, amount);
        break;
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};

// Process subscription payment
const processSubscriptionPayment = async (userId: string, creatorId: string, amount: number) => {
  try {
    // Check if subscription already exists
    const [existingSub] = await db
      .select()
      .from(user_subscriptions)
      .where(
        and(
          eq(user_subscriptions.subscriber_id, userId),
          eq(user_subscriptions.creator_id, creatorId),
          eq(user_subscriptions.status, 'active')
        )
      )
      .limit(1);

    if (existingSub) {
      throw new Error('Active subscription already exists');
    }

    // Create new subscription
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // Monthly subscription

    await db.insert(user_subscriptions).values({
      subscriber_id: userId,
      creator_id: creatorId,
      amount_paid: amount,
      status: 'active',
      billing_cycle: 'monthly',
      expires_at: expiresAt,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Update creator stats
    await db
      .update(creator_profiles)
      .set({
        total_subscribers: db.raw('total_subscribers + 1'),
        total_earnings: db.raw(`total_earnings + ${amount}`),
        updated_at: new Date()
      })
      .where(eq(creator_profiles.user_id, creatorId));

    // Send welcome message if configured
    await sendWelcomeMessage(userId, creatorId);

  } catch (error) {
    console.error('Error processing subscription payment:', error);
    throw error;
  }
};

// Process tip payment
const processTipPayment = async (userId: string, creatorId: string, amount: number, message?: string) => {
  try {
    // Create tip record
    await db.insert(tips).values({
      tipper_id: userId,
      creator_id: creatorId,
      amount,
      message: message || '',
      created_at: new Date()
    });

    // Update creator earnings
    await db
      .update(creator_profiles)
      .set({
        total_earnings: db.raw(`total_earnings + ${amount}`),
        updated_at: new Date()
      })
      .where(eq(creator_profiles.user_id, creatorId));

    // Send notification to creator
    await sendTipNotification(userId, creatorId, amount, message);

  } catch (error) {
    console.error('Error processing tip payment:', error);
    throw error;
  }
};

// Process PPV content payment
const processPPVPayment = async (userId: string, creatorId: string, contentId: string, amount: number) => {
  try {
    // Check if content exists and is PPV
    const [content] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, contentId))
      .limit(1);

    if (!content || !content.is_ppv) {
      throw new Error('Invalid PPV content');
    }

    // Grant access to PPV content (implement access control)
    // This would typically be done through a separate PPV access table
    
    // Update creator earnings
    await db
      .update(creator_profiles)
      .set({
        total_earnings: db.raw(`total_earnings + ${amount}`),
        updated_at: new Date()
      })
      .where(eq(creator_profiles.user_id, creatorId));

  } catch (error) {
    console.error('Error processing PPV payment:', error);
    throw error;
  }
};

// Process live stream payment
const processLiveStreamPayment = async (userId: string, creatorId: string, amount: number) => {
  try {
    // Grant live stream access (implement access control)
    
    // Update creator earnings
    await db
      .update(creator_profiles)
      .set({
        total_earnings: db.raw(`total_earnings + ${amount}`),
        updated_at: new Date()
      })
      .where(eq(creator_profiles.user_id, creatorId));

  } catch (error) {
    console.error('Error processing live stream payment:', error);
    throw error;
  }
};

// Creator Stripe Connect onboarding
export const createStripeConnectAccount = async (req: Request, res: Response) => {
  try {
    const { creatorId, businessType, country, email, phone }: CreatorOnboardingRequest = req.body;

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: country || 'US',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: businessType,
      metadata: {
        creatorId
      }
    });

    // Update creator profile with Stripe account ID
    await db
      .update(creator_profiles)
      .set({
        stripe_account_id: account.id,
        stripe_account_status: 'pending',
        updated_at: new Date()
      })
      .where(eq(creator_profiles.user_id, creatorId));

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/creator/stripe-refresh`,
      return_url: `${process.env.FRONTEND_URL}/creator/stripe-success`,
      type: 'account_onboarding',
    });

    res.json({ 
      accountId: account.id,
      onboardingUrl: accountLink.url
    });

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    res.status(500).json({ error: 'Failed to create Stripe account' });
  }
};

// Get creator earnings
export const getCreatorEarnings = async (req: Request, res: Response) => {
  try {
    const { creatorId } = req.params;

    // Get total earnings
    const [creatorProfile] = await db
      .select()
      .from(creator_profiles)
      .where(eq(creator_profiles.user_id, creatorId))
      .limit(1);

    if (!creatorProfile) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Get monthly earnings (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Get monthly subscription earnings
    const [monthlySubEarnings] = await db
      .select({ total: sum(user_subscriptions.amount_paid) })
      .from(user_subscriptions)
      .where(
        and(
          eq(user_subscriptions.creator_id, creatorId),
          gte(user_subscriptions.created_at, startOfMonth),
          lte(user_subscriptions.created_at, endOfMonth)
        )
      );

    // Get monthly tip earnings
    const [monthlyTipEarnings] = await db
      .select({ total: sum(tips.amount) })
      .from(tips)
      .where(
        and(
          eq(tips.creator_id, creatorId),
          gte(tips.created_at, startOfMonth),
          lte(tips.created_at, endOfMonth)
        )
      );

    const monthlyEarnings = (monthlySubEarnings?.total || 0) + (monthlyTipEarnings?.total || 0);

    // Get last payout info
    const [lastPayout] = await db
      .select()
      .from(creator_payouts)
      .where(eq(creator_payouts.creator_id, creatorId))
      .orderBy(desc(creator_payouts.created_at))
      .limit(1);

    const pendingPayout = creatorProfile.total_earnings - (lastPayout?.amount || 0);

    res.json({
      total_earnings: creatorProfile.total_earnings,
      monthly_earnings: monthlyEarnings,
      pending_payout: pendingPayout,
      last_payout: lastPayout?.amount || 0,
      last_payout_date: lastPayout?.created_at || null,
      next_payout_date: getNextPayoutDate(),
      payout_method: creatorProfile.stripe_account_id ? 'bank_account' : null
    });

  } catch (error) {
    console.error('Error getting creator earnings:', error);
    res.status(500).json({ error: 'Failed to get earnings' });
  }
};

// Request payout
export const requestPayout = async (req: Request, res: Response) => {
  try {
    const { creatorId } = req.body;

    // Get creator profile
    const [creatorProfile] = await db
      .select()
      .from(creator_profiles)
      .where(eq(creator_profiles.user_id, creatorId))
      .limit(1);

    if (!creatorProfile || !creatorProfile.stripe_account_id) {
      return res.status(400).json({ error: 'Creator not onboarded with Stripe' });
    }

    // Calculate pending payout
    const [lastPayout] = await db
      .select()
      .from(creator_payouts)
      .where(eq(creator_payouts.creator_id, creatorId))
      .orderBy(desc(creator_payouts.created_at))
      .limit(1);

    const pendingAmount = creatorProfile.total_earnings - (lastPayout?.amount || 0);

    // Minimum payout amount ($50)
    if (pendingAmount < 5000) {
      return res.status(400).json({ error: 'Minimum payout amount is $50' });
    }

    // Create Stripe transfer
    const transfer = await stripe.transfers.create({
      amount: pendingAmount,
      currency: 'usd',
      destination: creatorProfile.stripe_account_id,
      metadata: {
        creatorId,
        type: 'payout'
      }
    });

    // Record payout
    await db.insert(creator_payouts).values({
      creator_id: creatorId,
      amount: pendingAmount,
      stripe_transfer_id: transfer.id,
      status: 'pending',
      created_at: new Date()
    });

    res.json({ success: true, amount: pendingAmount });

  } catch (error) {
    console.error('Error requesting payout:', error);
    res.status(500).json({ error: 'Failed to request payout' });
  }
};

// Stripe webhook handler
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentSucceeded(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentFailed(failedPaymentIntent);
      break;

    case 'account.updated':
      const account = event.data.object as Stripe.Account;
      await handleAccountUpdated(account);
      break;

    case 'transfer.created':
      const transfer = event.data.object as Stripe.Transfer;
      await handleTransferCreated(transfer);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// Helper functions
const sendWelcomeMessage = async (userId: string, creatorId: string) => {
  try {
    // Get creator's welcome message settings
    const [creator] = await db
      .select()
      .from(creator_profiles)
      .where(eq(creator_profiles.user_id, creatorId))
      .limit(1);

    if (creator && creator.welcome_message) {
      await db.insert(messages).values({
        sender_id: creatorId,
        recipient_id: userId,
        content: creator.welcome_message,
        is_ppv: false,
        is_purchased: true,
        is_read: false,
        created_at: new Date()
      });
    }
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
};

const sendTipNotification = async (userId: string, creatorId: string, amount: number, message?: string) => {
  try {
    const notificationContent = `You received a $${(amount / 100).toFixed(2)} tip!${message ? ` Message: "${message}"` : ''}`;
    
    await db.insert(messages).values({
      sender_id: userId,
      recipient_id: creatorId,
      content: notificationContent,
      is_ppv: false,
      is_purchased: true,
      is_read: false,
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error sending tip notification:', error);
  }
};

const getNextPayoutDate = (): string => {
  const nextFriday = new Date();
  const dayOfWeek = nextFriday.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  nextFriday.setDate(nextFriday.getDate() + daysUntilFriday);
  return nextFriday.toISOString();
};

const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
  try {
    await db
      .update(payment_intents)
      .set({ 
        status: 'succeeded',
        updated_at: new Date()
      })
      .where(eq(payment_intents.stripe_payment_intent_id, paymentIntent.id));
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
};

const handlePaymentIntentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
  try {
    await db
      .update(payment_intents)
      .set({ 
        status: 'failed',
        updated_at: new Date()
      })
      .where(eq(payment_intents.stripe_payment_intent_id, paymentIntent.id));
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
};

const handleAccountUpdated = async (account: Stripe.Account) => {
  try {
    const creatorId = account.metadata?.creatorId;
    if (creatorId) {
      await db
        .update(creator_profiles)
        .set({
          stripe_account_status: account.details_submitted ? 'verified' : 'pending',
          stripe_onboarding_complete: account.charges_enabled && account.payouts_enabled,
          updated_at: new Date()
        })
        .where(eq(creator_profiles.user_id, creatorId));
    }
  } catch (error) {
    console.error('Error handling account updated:', error);
  }
};

const handleTransferCreated = async (transfer: Stripe.Transfer) => {
  try {
    const creatorId = transfer.metadata?.creatorId;
    if (creatorId) {
      await db
        .update(creator_payouts)
        .set({
          status: 'completed',
          updated_at: new Date()
        })
        .where(eq(creator_payouts.stripe_transfer_id, transfer.id));
    }
  } catch (error) {
    console.error('Error handling transfer created:', error);
  }
};

// Middleware for validating Stripe webhooks
export const validateStripeWebhook = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/webhooks/stripe') {
    req.body = Buffer.from(req.body);
  }
  next();
};