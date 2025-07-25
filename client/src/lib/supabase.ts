import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://igtkrpfpbbcciqyozuqb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlndGtycGZwYmJjY2lxeW96dXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIyOTcsImV4cCI6MjA2NjI2ODI5N30.Y1dJyTvdRyMCPMwPhXYBfq53Mx-rfm1n7lLQevQgvDs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database helper functions
export const supabaseHelpers = {
  // Posts
  async createPost(post: any) {
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getPosts(userId?: string) {
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:creator_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('creator_id', userId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  // Upload file to storage
  async uploadFile(bucket: string, file: File, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    return data
  },

  // Get public URL for file
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  },

  // Subscriptions
  async createSubscription(subscription: any) {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert(subscription)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getUserSubscriptions(userId: string) {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        creator:creator_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('subscriber_id', userId)
      .eq('status', 'active')
    
    if (error) throw error
    return data || []
  },

  // Tips
  async createTip(tip: any) {
    const { data, error } = await supabase
      .from('tips')
      .insert(tip)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Messages
  async sendMessage(message: any) {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getMessages(userId: string, otherUserId?: string) {
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        recipient:recipient_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (otherUserId) {
      query = query.or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  // Creator Profile
  async updateCreatorProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('creator_profiles')
      .upsert({ user_id: userId, ...updates })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getCreatorProfile(userId: string) {
    const { data, error } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // User Profile
  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // Get all creators for discovery
  async getCreators() {
    const { data, error } = await supabase
      .from('creator_profiles')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url,
          bio
        )
      `)
      .eq('is_active', true)
      .order('total_subscribers', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}