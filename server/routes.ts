import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPostSchema, insertProfileSchema, insertCreatorProfileSchema, insertMessageSchema } from "@shared/schema";
import { supabase } from "./supabase";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, display_name } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getProfileByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      
      const profile = await storage.createProfile({
        username,
        email,
        password,
        display_name,
      });
      
      res.json(profile);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const profile = await storage.getProfileByEmail(email);
      if (!profile || profile.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Posts routes
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getPublishedPosts(20);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.put("/api/posts/:id", async (req, res) => {
    try {
      const updates = req.body;
      const post = await storage.updatePost(req.params.id, updates);
      res.json(post);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const success = await storage.deletePost(req.params.id);
      if (success) {
        res.json({ message: "Post deleted successfully" });
      } else {
        res.status(404).json({ error: "Post not found" });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      // Placeholder for like functionality
      res.json({ success: true });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ error: "Failed to like post" });
    }
  });

  app.post("/api/posts/:id/share", async (req, res) => {
    try {
      // Placeholder for share functionality
      res.json({ success: true });
    } catch (error) {
      console.error("Error sharing post:", error);
      res.status(500).json({ error: "Failed to share post" });
    }
  });

  app.post("/api/posts/:id/bookmark", async (req, res) => {
    try {
      // Placeholder for bookmark functionality
      res.json({ success: true });
    } catch (error) {
      console.error("Error bookmarking post:", error);
      res.status(500).json({ error: "Failed to bookmark post" });
    }
  });

  // Creator posts routes
  app.get("/api/creators/:id/posts", async (req, res) => {
    try {
      const posts = await storage.getPostsByCreator(req.params.id, 20);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching creator posts:", error);
      res.status(500).json({ error: "Failed to fetch creator posts" });
    }
  });

  // Creators routes
  app.get("/api/creators", async (req, res) => {
    try {
      const creators = await storage.getCreators(10);
      res.json(creators);
    } catch (error) {
      console.error("Error fetching creators:", error);
      res.status(500).json({ error: "Failed to fetch creators" });
    }
  });

  app.post("/api/creators", async (req, res) => {
    try {
      const creatorData = insertCreatorProfileSchema.parse(req.body);
      const creatorProfile = await storage.createCreatorProfile(creatorData);
      res.json(creatorProfile);
    } catch (error) {
      console.error("Error creating creator profile:", error);
      res.status(500).json({ error: "Failed to create creator profile" });
    }
  });

  app.get("/api/creators/:username", async (req, res) => {
    try {
      // First try to get by username (most common case)
      let profile = await storage.getProfileByUsername(req.params.username);
      
      // If not found by username, try by ID  
      if (!profile) {
        profile = await storage.getProfile(req.params.username);
      }
      
      if (!profile) {
        return res.status(404).json({ error: "Creator not found" });
      }
      
      const creatorProfile = await storage.getCreatorProfile(profile.id);
      res.json({ ...profile, creator_profile: creatorProfile });
    } catch (error) {
      console.error("Error fetching creator:", error);
      res.status(500).json({ error: "Failed to fetch creator" });
    }
  });

  // Profile routes
  app.get("/api/profile/:id", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile/:id", async (req, res) => {
    try {
      const updates = req.body;
      const profile = await storage.updateProfile(req.params.id, updates);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Messages routes
  app.get("/api/messages/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { otherUserId } = req.query;
      
      if (!otherUserId) {
        return res.status(400).json({ error: "Missing otherUserId parameter" });
      }
      
      const messages = await storage.getMessages(userId, otherUserId as string);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.put("/api/messages/:id/read", async (req, res) => {
    try {
      const message = await storage.markMessageAsRead(req.params.id);
      res.json(message);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // Subscription routes
  app.post("/api/subscriptions", async (req, res) => {
    try {
      const { subscriber_id, creator_id, amount_paid } = req.body;
      
      const subscription = await storage.createSubscription(subscriber_id, creator_id, amount_paid);
      res.json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  app.get("/api/subscriptions/:userId", async (req, res) => {
    try {
      const subscriptions = await storage.getUserSubscriptions(req.params.userId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Tips routes
  app.post("/api/tips", async (req, res) => {
    try {
      const { tipper_id, creator_id, amount, message } = req.body;
      
      const tip = await storage.createTip(tipper_id, creator_id, amount, message);
      res.json(tip);
    } catch (error) {
      console.error("Error creating tip:", error);
      res.status(500).json({ error: "Failed to create tip" });
    }
  });

  // Search routes
  app.get("/api/search", async (req, res) => {
    try {
      const { q, type = 'all', limit = 10 } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: "Search query required" });
      }
      
      const query = q as string;
      
      let results = {
        creators: [],
        posts: []
      };
      
      if (type === 'all' || type === 'creators') {
        results.creators = await storage.searchProfiles(query, parseInt(limit as string));
      }
      
      if (type === 'all' || type === 'posts') {
        // Simplified post search - would implement full-text search in real app
        results.posts = await storage.getPublishedPosts(parseInt(limit as string));
      }
      
      res.json(results);
    } catch (error) {
      console.error("Error searching:", error);
      res.status(500).json({ error: "Failed to search" });
    }
  });

  // Notifications routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      // Placeholder - would fetch user notifications
      res.json([
        {
          id: `notif_${Date.now()}`,
          type: 'new_subscriber',
          title: 'New Subscriber!',
          message: 'You have a new subscriber',
          is_read: false,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      // Placeholder for marking notification as read
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Live stream routes
  app.get("/api/streams", async (req, res) => {
    try {
      // Placeholder - would fetch active streams
      res.json([]);
    } catch (error) {
      console.error("Error fetching streams:", error);
      res.status(500).json({ error: "Failed to fetch streams" });
    }
  });

  app.post("/api/streams", async (req, res) => {
    try {
      const { creator_id, title, description } = req.body;
      
      // Simplified stream creation
      res.json({
        id: `stream_${Date.now()}`,
        creator_id,
        title,
        description,
        is_active: true,
        stream_key: `sk_${Date.now()}`,
        viewer_count: 0,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error creating stream:", error);
      res.status(500).json({ error: "Failed to create stream" });
    }
  });

  // File upload routes
  app.post("/api/upload", async (req, res) => {
    try {
      // Placeholder for file upload
      // In real app would handle multipart/form-data and upload to cloud storage
      res.json({
        url: `/placeholder-upload-${Date.now()}.jpg`,
        type: 'image',
        size: 1024000
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/:creatorId", async (req, res) => {
    try {
      const analytics = await storage.getCreatorAnalytics(req.params.creatorId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Platform stats
  app.get("/api/stats", async (req, res) => {
    try {
      const creators = await storage.getCreators(1000);
      const posts = await storage.getPublishedPosts(1000);
      
      res.json({
        total_creators: creators.length,
        total_posts: posts.length,
        total_users: creators.length + 500, // Simplified
        active_streams: 0,
        total_revenue: 125000.50
      });
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ error: "Failed to fetch platform stats" });
    }
  });

  // Stripe Connect routes (placeholder implementations)
  app.post("/api/stripe/connect", async (req, res) => {
    try {
      const { creator_id } = req.body;
      
      // In a real app, this would create a Stripe Connect account
      // For now, just return a mock response
      res.json({
        account_id: `acct_${Date.now()}`,
        onboarding_url: `https://connect.stripe.com/setup/e/${Date.now()}`,
        status: 'pending'
      });
    } catch (error) {
      console.error("Error setting up Stripe Connect:", error);
      res.status(500).json({ error: "Failed to setup Stripe Connect" });
    }
  });

  app.post("/api/stripe/disconnect", async (req, res) => {
    try {
      const { creator_id } = req.body;
      
      // In a real app, this would disconnect the Stripe account
      res.json({ success: true });
    } catch (error) {
      console.error("Error disconnecting Stripe:", error);
      res.status(500).json({ error: "Failed to disconnect Stripe" });
    }
  });

  // PPV Purchase route
  app.post("/api/messages/purchase", async (req, res) => {
    try {
      const { buyer_id, seller_id, message_id, amount } = req.body;
      
      // In a real app, this would handle payment processing
      res.json({
        id: `purchase_${Date.now()}`,
        buyer_id,
        seller_id,
        message_id,
        amount,
        status: 'completed',
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error processing PPV purchase:", error);
      res.status(500).json({ error: "Failed to process purchase" });
    }
  });

  // Custom Content Request Routes
  app.post('/api/custom-requests', async (req, res) => {
    try {
      const { 
        fan_id, 
        creator_id, 
        title, 
        description, 
        content_type, 
        price, 
        deadline, 
        is_anonymous, 
        special_instructions 
      } = req.body;

      // Validate required fields
      if (!fan_id || !creator_id || !title || !description || !price || !deadline) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create payment intent for the custom request
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: price * 100, // Convert to cents
        currency: 'usd',
        metadata: {
          type: 'custom_request',
          fan_id,
          creator_id,
          title
        }
      });

      // Create the custom request
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const customRequest = {
        id: requestId,
        fan_id,
        creator_id,
        title,
        description,
        content_type,
        price,
        deadline,
        is_anonymous,
        special_instructions,
        status: 'pending',
        payment_status: 'pending',
        stripe_payment_intent_id: paymentIntent.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store in database (simplified for demo)
      await storage.createCustomRequest(customRequest);

      // Notify creator about new request
      await storage.createNotification({
        user_id: creator_id,
        type: 'custom_request',
        message: `New custom content request: "${title}"`,
        data: { request_id: requestId, amount: price }
      });

      res.json({ 
        success: true, 
        request: customRequest,
        client_secret: paymentIntent.client_secret 
      });

    } catch (error) {
      console.error('Error creating custom request:', error);
      res.status(500).json({ error: 'Failed to create custom request' });
    }
  });

  // Get custom requests for creator
  app.get('/api/custom-requests/creator/:creatorId', async (req, res) => {
    try {
      const { creatorId } = req.params;
      const requests = await storage.getCustomRequestsByCreator(creatorId);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching creator requests:', error);
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  });

  // Get custom requests for fan
  app.get('/api/custom-requests/fan/:fanId', async (req, res) => {
    try {
      const { fanId } = req.params;
      const requests = await storage.getCustomRequestsByFan(fanId);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching fan requests:', error);
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  });

  // Accept/Decline custom request
  app.post('/api/custom-requests/:requestId/:action', async (req, res) => {
    try {
      const { requestId, action } = req.params;
      
      if (!['accept', 'decline'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
      }

      const request = await storage.getCustomRequestById(requestId);
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      const newStatus = action === 'accept' ? 'accepted' : 'declined';
      await storage.updateCustomRequestStatus(requestId, newStatus);

      // If declined, process refund
      if (action === 'decline') {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.paymentIntents.cancel(request.stripe_payment_intent_id);
        await storage.updateCustomRequestPaymentStatus(requestId, 'refunded');
      }

      // Notify fan
      await storage.createNotification({
        user_id: request.fan_id,
        type: 'request_update',
        message: `Your custom request "${request.title}" was ${action}ed`,
        data: { request_id: requestId, action }
      });

      res.json({ success: true });

    } catch (error) {
      console.error(`Error ${req.params.action}ing request:`, error);
      res.status(500).json({ error: `Failed to ${req.params.action} request` });
    }
  });

  // Deliver custom content
  app.post('/api/custom-requests/deliver', async (req, res) => {
    try {
      const { requestId } = req.body;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const request = await storage.getCustomRequestById(requestId);
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      // Upload files to Supabase storage
      const uploadedFiles = [];
      for (const file of files) {
        const fileName = `custom-requests/${requestId}/${Date.now()}_${file.originalname}`;
        const { data, error } = await supabase.storage
          .from('content')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600'
          });

        if (error) throw error;
        uploadedFiles.push(data.path);
      }

      // Update request with delivered content
      await storage.updateCustomRequest(requestId, {
        status: 'completed',
        delivered_content: uploadedFiles,
        completed_at: new Date().toISOString()
      });

      // Process payment to creator
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      await stripe.paymentIntents.confirm(request.stripe_payment_intent_id);
      await storage.updateCustomRequestPaymentStatus(requestId, 'paid');

      // Add to creator earnings
      await storage.addCreatorEarnings(request.creator_id, request.price * 100);

      // Notify fan
      await storage.createNotification({
        user_id: request.fan_id,
        type: 'content_delivered',
        message: `Your custom content "${request.title}" has been delivered!`,
        data: { request_id: requestId, content_count: uploadedFiles.length }
      });

      res.json({ success: true, delivered_files: uploadedFiles.length });

    } catch (error) {
      console.error('Error delivering content:', error);
      res.status(500).json({ error: 'Failed to deliver content' });
    }
  });

  // Content access verification
  app.get('/api/content/:contentId/access', async (req, res) => {
    try {
      const { contentId } = req.params;
      const userId = req.headers.authorization?.replace('Bearer ', '');

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const hasAccess = await storage.checkContentAccess(userId, contentId);
      res.json({ hasAccess });

    } catch (error) {
      console.error('Error checking content access:', error);
      res.status(500).json({ error: 'Failed to check access' });
    }
  });

  // Enhanced Analytics Routes
  app.get('/api/analytics/:creatorId', async (req, res) => {
    try {
      const { creatorId } = req.params;
      const { period = '30d' } = req.query;

      const analytics = await storage.getDetailedAnalytics(creatorId, period);
      res.json(analytics);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Enhanced subscription management
  app.post('/api/subscriptions/:subscriptionId/cancel', async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      
      await storage.cancelSubscription(subscriptionId);
      res.json({ success: true });

    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });

  app.post('/api/subscriptions/:subscriptionId/reactivate', async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      
      await storage.reactivateSubscription(subscriptionId);
      res.json({ success: true });

    } catch (error) {
      console.error('Error reactivating subscription:', error);
      res.status(500).json({ error: 'Failed to reactivate subscription' });
    }
  });

  // User subscriptions
  app.get('/api/subscriptions/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const subscriptions = await storage.getUserSubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  });

  // Creator verification and onboarding
  app.post('/api/creators/verify', async (req, res) => {
    try {
      const { userId, documents } = req.body;
      
      // Process verification documents
      const verificationId = await storage.createVerificationRequest(userId, documents);
      
      res.json({ success: true, verificationId });

    } catch (error) {
      console.error('Error submitting verification:', error);
      res.status(500).json({ error: 'Failed to submit verification' });
    }
  });

  // Security and content protection
  app.post('/api/security/violation', async (req, res) => {
    try {
      const { userId, contentId, creatorId, violation, deviceInfo } = req.body;
      
      await storage.logSecurityViolation({
        user_id: userId,
        content_id: contentId,
        creator_id: creatorId,
        violation_type: violation,
        device_info: deviceInfo,
        timestamp: new Date().toISOString()
      });

      // Check if user should be blocked
      const violationCount = await storage.getUserViolationCount(userId);
      if (violationCount >= 5) {
        await storage.blockUser(userId, 'Multiple security violations');
      }

      res.json({ success: true });

    } catch (error) {
      console.error('Error logging security violation:', error);
      res.status(500).json({ error: 'Failed to log violation' });
    }
  });

  app.post('/api/security/device-access', async (req, res) => {
    try {
      const { userId, contentId, creatorId, deviceInfo } = req.body;
      
      await storage.logDeviceAccess({
        user_id: userId,
        content_id: contentId,
        creator_id: creatorId,
        device_info: deviceInfo,
        timestamp: new Date().toISOString()
      });

      res.json({ success: true });

    } catch (error) {
      console.error('Error logging device access:', error);
      res.status(500).json({ error: 'Failed to log device access' });
    }
  });

  // Content discovery and search
  app.get('/api/discover', async (req, res) => {
    try {
      const { category, sort = 'popular', page = 1, limit = 20 } = req.query;
      
      const content = await storage.discoverContent({
        category,
        sort,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json(content);

    } catch (error) {
      console.error('Error fetching discover content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  });

  app.get('/api/search', async (req, res) => {
    try {
      const { q, type = 'all', page = 1, limit = 20 } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Search query required' });
      }

      const results = await storage.searchContent({
        query: q as string,
        type: type as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json(results);

    } catch (error) {
      console.error('Error searching content:', error);
      res.status(500).json({ error: 'Failed to search content' });
    }
  });

  // Notifications
  app.get('/api/notifications/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { unread_only = false } = req.query;
      
      const notifications = await storage.getUserNotifications(userId, unread_only === 'true');
      res.json(notifications);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.post('/api/notifications/:notificationId/read', async (req, res) => {
    try {
      const { notificationId } = req.params;
      
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });

    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // Payment processing routes
  app.post('/api/payments/create-intent', async (req, res) => {
    try {
      const { type, amount, creatorId, userId, contentId, subscriptionTier, tipMessage, description } = req.body;

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: {
          type,
          creatorId,
          userId,
          contentId: contentId || '',
          subscriptionTier: subscriptionTier || '',
          tipMessage: tipMessage || '',
          description: description || ''
        }
      });

      res.json({ client_secret: paymentIntent.client_secret });

    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });

  app.post('/api/payments/confirm', async (req, res) => {
    try {
      const { paymentIntentId, type, amount, creatorId, userId, contentId, tipMessage } = req.body;

      // Process based on payment type
      switch (type) {
        case 'subscription':
          await storage.createSubscription({
            subscriber_id: userId,
            creator_id: creatorId,
            amount_paid: amount,
            status: 'active',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          });
          break;
        
        case 'tip':
          await storage.createTip({
            tipper_id: userId,
            creator_id: creatorId,
            amount,
            message: tipMessage || ''
          });
          break;
        
        case 'ppv':
          await storage.grantPPVAccess(userId, contentId);
          break;
      }

      // Update creator earnings
      await storage.addCreatorEarnings(creatorId, amount);

      res.json({ success: true });

    } catch (error) {
      console.error('Error confirming payment:', error);
      res.status(500).json({ error: 'Failed to confirm payment' });
    }
  });

  // Creator earnings and payouts
  app.get('/api/creators/:creatorId/earnings', async (req, res) => {
    try {
      const { creatorId } = req.params;
      const earnings = await storage.getCreatorEarnings(creatorId);
      res.json(earnings);
    } catch (error) {
      console.error('Error fetching creator earnings:', error);
      res.status(500).json({ error: 'Failed to fetch earnings' });
    }
  });

  app.post('/api/payouts/request', async (req, res) => {
    try {
      const { creatorId } = req.body;
      
      const payout = await storage.requestPayout(creatorId);
      res.json({ success: true, amount: payout.amount });

    } catch (error) {
      console.error('Error requesting payout:', error);
      res.status(500).json({ error: 'Failed to request payout' });
    }
  });

  // Advanced creator features
  app.post('/api/creators/:creatorId/welcome-message', async (req, res) => {
    try {
      const { creatorId } = req.params;
      const { message, media } = req.body;
      
      await storage.setWelcomeMessage(creatorId, message, media);
      res.json({ success: true });

    } catch (error) {
      console.error('Error setting welcome message:', error);
      res.status(500).json({ error: 'Failed to set welcome message' });
    }
  });

  app.get('/api/creators/:creatorId/subscribers', async (req, res) => {
    try {
      const { creatorId } = req.params;
      const { active_only = true } = req.query;
      
      const subscribers = await storage.getCreatorSubscribers(creatorId, active_only === 'true');
      res.json(subscribers);

    } catch (error) {
      console.error('Error fetching subscribers:', error);
      res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
  });

  // Content scheduling
  app.post('/api/posts/schedule', async (req, res) => {
    try {
      const { creatorId, content, scheduledFor, mediaFiles } = req.body;
      
      const scheduledPost = await storage.schedulePost({
        creator_id: creatorId,
        content,
        scheduled_for: scheduledFor,
        media_files: mediaFiles,
        status: 'scheduled'
      });

      res.json({ success: true, postId: scheduledPost.id });

    } catch (error) {
      console.error('Error scheduling post:', error);
      res.status(500).json({ error: 'Failed to schedule post' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
