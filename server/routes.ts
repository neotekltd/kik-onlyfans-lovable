import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPostSchema, insertProfileSchema, insertCreatorProfileSchema, insertMessageSchema } from "@shared/schema";

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

  app.get("/api/creators/:id", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile || !profile.is_creator) {
        return res.status(404).json({ error: "Creator not found" });
      }
      
      const creatorProfile = await storage.getCreatorProfile(req.params.id);
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
      // Placeholder analytics data
      res.json({
        total_earnings: 1250.50,
        total_subscribers: 150,
        total_posts: 25,
        monthly_earnings: 850.25,
        new_subscribers_this_month: 12,
        top_content: [
          { id: '1', title: 'Popular Post', views: 245, earnings: 125.50 }
        ],
        earnings_chart: [
          { date: '2024-01', amount: 650.25 },
          { date: '2024-02', amount: 750.75 },
          { date: '2024-03', amount: 850.25 }
        ]
      });
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

  const httpServer = createServer(app);

  return httpServer;
}
