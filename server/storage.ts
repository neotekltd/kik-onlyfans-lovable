import { db } from "./db";
import { profiles, creator_profiles, posts, messages, user_subscriptions, tips, type Profile, type InsertProfile, type CreatorProfile, type InsertCreatorProfile, type Post, type InsertPost, type Message, type InsertMessage, type UserSubscription, type Tip } from "@shared/schema";
import { eq, desc, and, or } from "drizzle-orm";

export interface IStorage {
  // User/Profile operations
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByUsername(username: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, updates: Partial<Profile>): Promise<Profile>;
  
  // Creator operations
  getCreatorProfile(userId: string): Promise<CreatorProfile | undefined>;
  createCreatorProfile(creatorProfile: InsertCreatorProfile): Promise<CreatorProfile>;
  updateCreatorProfile(id: string, updates: Partial<CreatorProfile>): Promise<CreatorProfile>;
  
  // Post operations
  getPost(id: string): Promise<Post | undefined>;
  getPostsByCreator(creatorId: string, limit?: number): Promise<Post[]>;
  getPublishedPosts(limit?: number): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post>;
  deletePost(id: string): Promise<boolean>;
  
  // Message operations
  getMessages(userId1: string, userId2: string, limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message>;
  
  // Subscription operations
  createSubscription(subscriberId: string, creatorId: string, amount: number): Promise<UserSubscription>;
  getUserSubscriptions(userId: string): Promise<UserSubscription[]>;
  
  // Tips operations
  createTip(tipperId: string, creatorId: string, amount: number, message?: string): Promise<Tip>;
  
  // Analytics operations
  getCreatorAnalytics(creatorId: string): Promise<any>;
  
  // General operations
  getCreators(limit?: number): Promise<Profile[]>;
  searchProfiles(query: string, limit?: number): Promise<Profile[]>;
}

export class DatabaseStorage implements IStorage {
  // Profile operations
  async getProfile(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return result[0];
  }

  async getProfileByUsername(username: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.username, username)).limit(1);
    return result[0];
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
    return result[0];
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const result = await db.insert(profiles).values(profile).returning();
    return result[0];
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    const result = await db.update(profiles).set(updates).where(eq(profiles.id, id)).returning();
    return result[0];
  }

  // Creator operations
  async getCreatorProfile(userId: string): Promise<CreatorProfile | undefined> {
    const result = await db.select().from(creator_profiles).where(eq(creator_profiles.user_id, userId)).limit(1);
    return result[0];
  }

  async createCreatorProfile(creatorProfile: InsertCreatorProfile): Promise<CreatorProfile> {
    const result = await db.insert(creator_profiles).values(creatorProfile).returning();
    return result[0];
  }

  async updateCreatorProfile(id: string, updates: Partial<CreatorProfile>): Promise<CreatorProfile> {
    const result = await db.update(creator_profiles).set(updates).where(eq(creator_profiles.id, id)).returning();
    return result[0];
  }

  // Post operations
  async getPost(id: string): Promise<Post | undefined> {
    const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    return result[0];
  }

  async getPostsByCreator(creatorId: string, limit = 20): Promise<Post[]> {
    return await db.select().from(posts)
      .where(and(eq(posts.creator_id, creatorId), eq(posts.is_published, true)))
      .orderBy(desc(posts.created_at))
      .limit(limit);
  }

  async getPublishedPosts(limit = 20): Promise<Post[]> {
    return await db.select().from(posts)
      .where(eq(posts.is_published, true))
      .orderBy(desc(posts.created_at))
      .limit(limit);
  }

  async createPost(post: InsertPost): Promise<Post> {
    const result = await db.insert(posts).values(post).returning();
    return result[0];
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    const result = await db.update(posts).set(updates).where(eq(posts.id, id)).returning();
    return result[0];
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id)).returning();
    return result.length > 0;
  }

  // Message operations
  async getMessages(userId1: string, userId2: string, limit = 50): Promise<Message[]> {
    return await db.select().from(messages)
      .where(
        or(
          and(eq(messages.sender_id, userId1), eq(messages.recipient_id, userId2)),
          and(eq(messages.sender_id, userId2), eq(messages.recipient_id, userId1))
        )
      )
      .orderBy(desc(messages.created_at))
      .limit(limit);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async markMessageAsRead(id: string): Promise<Message> {
    const result = await db.update(messages)
      .set({ is_read: true })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  // General operations
  async getCreators(limit = 10): Promise<Profile[]> {
    return await db.select().from(profiles)
      .where(eq(profiles.is_creator, true))
      .orderBy(desc(profiles.created_at))
      .limit(limit);
  }

  async searchProfiles(query: string, limit = 10): Promise<Profile[]> {
    return await db.select().from(profiles)
      .where(
        or(
          eq(profiles.username, query),
          eq(profiles.display_name, query)
        )
      )
      .limit(limit);
  }
}

  // Subscription operations
  async createSubscription(subscriberId: string, creatorId: string, amount: number): Promise<UserSubscription> {
    const result = await db.insert(user_subscriptions).values({
      subscriber_id: subscriberId,
      creator_id: creatorId,
      amount_paid: amount,
      status: 'active'
    }).returning();
    
    return result[0];
  }

  async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    return await db.select().from(user_subscriptions)
      .where(eq(user_subscriptions.subscriber_id, userId))
      .orderBy(desc(user_subscriptions.created_at));
  }

  // Tips operations
  async createTip(tipperId: string, creatorId: string, amount: number, message?: string): Promise<Tip> {
    const result = await db.insert(tips).values({
      tipper_id: tipperId,
      creator_id: creatorId,
      amount,
      message: message || null
    }).returning();
    
    return result[0];
  }

  // Analytics operations
  async getCreatorAnalytics(creatorId: string): Promise<any> {
    const [creatorProfile] = await db.select().from(creator_profiles)
      .where(eq(creator_profiles.user_id, creatorId));
    
    return {
      total_earnings: creatorProfile?.total_earnings || 0,
      total_subscribers: 0,
      total_posts: 0,
      monthly_earnings: (creatorProfile?.total_earnings || 0) * 0.8,
      new_subscribers_this_month: 0,
      total_tips: 0
    };
  }
}

export const storage = new DatabaseStorage();
