import { pgTable, text, serial, integer, boolean, timestamp, uuid, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const messageTypeEnum = pgEnum("message_type", ["text", "image", "video", "file"]);
export const payoutStatusEnum = pgEnum("payout_status", ["pending", "processing", "completed", "failed"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "expired"]);

// Core user tables
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  display_name: text("display_name").notNull(),
  bio: text("bio"),
  avatar_url: text("avatar_url"),
  cover_url: text("cover_url"),
  location: text("location"),
  website_url: text("website_url"),
  twitter_handle: text("twitter_handle"),
  instagram_handle: text("instagram_handle"),
  is_creator: boolean("is_creator").default(false),
  is_verified: boolean("is_verified").default(false),
  verification_status: text("verification_status").default("pending"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const creator_profiles = pgTable("creator_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => profiles.id).notNull(),
  subscription_price: integer("subscription_price").default(0),
  total_earnings: integer("total_earnings").default(0),
  total_subscribers: integer("total_subscribers").default(0),
  total_posts: integer("total_posts").default(0),
  content_categories: text("content_categories").array(),
  payout_email: text("payout_email"),
  tax_id: text("tax_id"),
  bank_account_info: jsonb("bank_account_info"),
  platform_fee_paid_until: timestamp("platform_fee_paid_until"),
  is_platform_fee_active: boolean("is_platform_fee_active").default(false),
  stripe_account_id: text("stripe_account_id"),
  stripe_account_status: text("stripe_account_status").default("pending"),
  stripe_onboarding_complete: boolean("stripe_onboarding_complete").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Content tables
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  creator_id: uuid("creator_id").references(() => profiles.id).notNull(),
  title: text("title"),
  description: text("description"),
  content_type: text("content_type").notNull(),
  media_urls: text("media_urls").array(),
  thumbnail_url: text("thumbnail_url"),
  is_premium: boolean("is_premium").default(false),
  is_ppv: boolean("is_ppv").default(false),
  ppv_price: integer("ppv_price"),
  is_published: boolean("is_published").default(false),
  like_count: integer("like_count").default(0),
  comment_count: integer("comment_count").default(0),
  view_count: integer("view_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const post_likes = pgTable("post_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  post_id: uuid("post_id").references(() => posts.id).notNull(),
  user_id: uuid("user_id").references(() => profiles.id).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const post_comments = pgTable("post_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  post_id: uuid("post_id").references(() => posts.id).notNull(),
  user_id: uuid("user_id").references(() => profiles.id).notNull(),
  content: text("content").notNull(),
  parent_id: uuid("parent_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Social features
export const follows = pgTable("follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  follower_id: uuid("follower_id").references(() => profiles.id).notNull(),
  following_id: uuid("following_id").references(() => profiles.id).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sender_id: uuid("sender_id").references(() => profiles.id).notNull(),
  recipient_id: uuid("recipient_id").references(() => profiles.id).notNull(),
  content: text("content"),
  message_type: messageTypeEnum("message_type").default("text"),
  media_url: text("media_url"),
  is_ppv: boolean("is_ppv").default(false),
  ppv_price: integer("ppv_price"),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

// Subscription and monetization
export const user_subscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriber_id: uuid("subscriber_id").references(() => profiles.id).notNull(),
  creator_id: uuid("creator_id").references(() => profiles.id).notNull(),
  plan_id: uuid("plan_id"),
  status: subscriptionStatusEnum("status").default("active"),
  start_date: timestamp("start_date").defaultNow(),
  end_date: timestamp("end_date"),
  amount_paid: integer("amount_paid").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const subscription_plans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  creator_id: uuid("creator_id").references(() => profiles.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  duration_months: integer("duration_months").default(1),
  features: text("features").array(),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const tips = pgTable("tips", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipper_id: uuid("tipper_id").references(() => profiles.id).notNull(),
  creator_id: uuid("creator_id").references(() => profiles.id).notNull(),
  amount: integer("amount").notNull(),
  message: text("message"),
  created_at: timestamp("created_at").defaultNow(),
});

export const ppv_purchases = pgTable("ppv_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  buyer_id: uuid("buyer_id").references(() => profiles.id).notNull(),
  seller_id: uuid("seller_id").references(() => profiles.id).notNull(),
  post_id: uuid("post_id").references(() => posts.id),
  message_id: uuid("message_id").references(() => messages.id),
  amount: integer("amount").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  creator_id: uuid("creator_id").references(() => profiles.id).notNull(),
  amount: integer("amount").notNull(),
  status: payoutStatusEnum("status").default("pending"),
  payout_method: text("payout_method"),
  payout_details: jsonb("payout_details"),
  processed_at: timestamp("processed_at"),
  created_at: timestamp("created_at").defaultNow(),
});

// Live streaming
export const live_streams = pgTable("live_streams", {
  id: uuid("id").primaryKey().defaultRandom(),
  creator_id: uuid("creator_id").references(() => profiles.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  is_active: boolean("is_active").default(false),
  viewer_count: integer("viewer_count").default(0),
  stream_key: text("stream_key"),
  rtmp_url: text("rtmp_url"),
  hls_url: text("hls_url"),
  thumbnail_url: text("thumbnail_url"),
  scheduled_start: timestamp("scheduled_start"),
  actual_start: timestamp("actual_start"),
  actual_end: timestamp("actual_end"),
  max_viewers: integer("max_viewers").default(0),
  total_tips: integer("total_tips").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Content collections
export const content_collections = pgTable("content_collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  creator_id: uuid("creator_id").references(() => profiles.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  is_public: boolean("is_public").default(true),
  price: integer("price").default(0),
  thumbnail_url: text("thumbnail_url"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const collection_posts = pgTable("collection_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  collection_id: uuid("collection_id").references(() => content_collections.id).notNull(),
  post_id: uuid("post_id").references(() => posts.id).notNull(),
  order_index: integer("order_index"),
  created_at: timestamp("created_at").defaultNow(),
});

// Notifications and activity
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => profiles.id).notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  data: jsonb("data"),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const user_activity = pgTable("user_activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => profiles.id).notNull(),
  activity_type: text("activity_type").notNull(),
  target_id: uuid("target_id"),
  target_type: text("target_type"),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").defaultNow(),
});

// Content moderation
export const content_reports = pgTable("content_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporter_id: uuid("reporter_id").references(() => profiles.id).notNull(),
  content_type: text("content_type").notNull(),
  reported_content_id: uuid("reported_content_id").notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").default("pending"),
  reviewed_by: uuid("reviewed_by").references(() => profiles.id),
  reviewed_at: timestamp("reviewed_at"),
  created_at: timestamp("created_at").defaultNow(),
});

// Age verification
export const age_verification_documents = pgTable("age_verification_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => profiles.id).notNull(),
  document_type: text("document_type").notNull(),
  front_document_url: text("front_document_url"),
  back_document_url: text("back_document_url"),
  selfie_with_id_url: text("selfie_with_id_url"),
  note_selfie_url: text("note_selfie_url"),
  status: text("status").default("pending"),
  admin_notes: text("admin_notes"),
  submission_date: timestamp("submission_date").defaultNow(),
  review_date: timestamp("review_date"),
  reviewed_by: uuid("reviewed_by").references(() => profiles.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Welcome messages
export const welcome_messages = pgTable("welcome_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  creator_id: uuid("creator_id").references(() => profiles.id).notNull(),
  content: text("content"),
  media_url: text("media_url"),
  message_type: messageTypeEnum("message_type").default("text"),
  is_ppv: boolean("is_ppv").default(false),
  ppv_price: integer("ppv_price"),
  delay_hours: integer("delay_hours").default(0),
  is_active: boolean("is_active").default(true),
  sequence_order: integer("sequence_order").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Schema validation
export const insertProfileSchema = createInsertSchema(profiles).pick({
  username: true,
  email: true,
  password: true,
  display_name: true,
  bio: true,
  location: true,
  website_url: true,
  twitter_handle: true,
  instagram_handle: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  creator_id: true,
  title: true,
  description: true,
  content_type: true,
  media_urls: true,
  thumbnail_url: true,
  is_premium: true,
  is_ppv: true,
  ppv_price: true,
  is_published: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  sender_id: true,
  recipient_id: true,
  content: true,
  message_type: true,
  media_url: true,
  is_ppv: true,
  ppv_price: true,
});

export const insertCreatorProfileSchema = createInsertSchema(creator_profiles).pick({
  user_id: true,
  subscription_price: true,
  content_categories: true,
  payout_email: true,
});

// Welcome message schema
export const insertWelcomeMessageSchema = createInsertSchema(welcome_messages, {
  content: z.string().optional().nullable(),
  media_url: z.string().optional().nullable(),
  message_type: z.enum(["text", "image", "video", "file"]).default("text"),
  is_ppv: z.boolean().default(false),
  ppv_price: z.number().optional().nullable(),
  delay_hours: z.number().default(0),
  is_active: z.boolean().default(true),
  sequence_order: z.number().default(0),
});

// Types
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertCreatorProfile = z.infer<typeof insertCreatorProfileSchema>;
export type CreatorProfile = typeof creator_profiles.$inferSelect;
export type UserSubscription = typeof user_subscriptions.$inferSelect;
export type Tip = typeof tips.$inferSelect;
export type PPVPurchase = typeof ppv_purchases.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AgeVerificationDocument = typeof age_verification_documents.$inferSelect;
export type LiveStream = typeof live_streams.$inferSelect;
export type ContentCollection = typeof content_collections.$inferSelect;
export type InsertWelcomeMessage = z.infer<typeof insertWelcomeMessageSchema>;
export type WelcomeMessage = typeof welcome_messages.$inferSelect;
