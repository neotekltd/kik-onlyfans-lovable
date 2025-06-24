
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Heart, Users, Star, TrendingUp, Search, Filter } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CreatorCard from '@/components/CreatorCard';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [creators, setCreators] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const categories = [
    'Fashion', 'Fitness', 'Gaming', 'Lifestyle', 'Art', 'Music', 
    'Cooking', 'Travel', 'Beauty', 'Technology'
  ];

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        let query = supabase
          .from('profiles')
          .select(`
            *,
            creator_profiles (
              subscription_price,
              total_subscribers,
              content_categories
            )
          `)
          .eq('is_creator', true)
          .order('created_at', { ascending: false });

        if (searchTerm) {
          query = query.or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        let filteredCreators = data || [];

        if (selectedCategory) {
          filteredCreators = filteredCreators.filter(creator => 
            creator.creator_profiles?.content_categories?.includes(selectedCategory)
          );
        }

        const formattedCreators = filteredCreators.map(creator => ({
          ...creator,
          subscriber_count: creator.creator_profiles?.total_subscribers || 0,
          subscription_price: creator.creator_profiles?.subscription_price || 0,
          categories: creator.creator_profiles?.content_categories || [],
        }));

        setCreators(formattedCreators);
      } catch (error) {
        console.error('Error fetching creators:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, [searchTerm, selectedCategory]);

  const featuredStats = [
    { label: "Active Creators", value: "10K+", icon: Users },
    { label: "Content Posts", value: "50K+", icon: Heart },
    { label: "Verified Creators", value: "500+", icon: Star },
    { label: "Monthly Growth", value: "25%", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-creator-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{" "}
            <span className="gradient-text">KikOnlyFans</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The ultimate platform for content creators to monetize their work and connect with their audience. 
            Join thousands of creators who are building their communities and earning from their passion.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {user ? (
              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  className="gradient-bg text-white px-8 py-3"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
                {!profile?.is_creator && (
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/creator')}
                  >
                    Become a Creator
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  className="gradient-bg text-white px-8 py-3"
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {featuredStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full gradient-bg text-white mb-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 px-4 bg-white/50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Creators
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover amazing content from our top-rated creators
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {creators.slice(0, 8).map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          )}

          {creators.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No creators found matching your criteria.</p>
              <Button onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
              }}>
                Clear Filters
              </Button>
            </div>
          )}

          {creators.length > 8 && (
            <div className="text-center mt-8">
              <Button size="lg" variant="outline">
                View All Creators
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 rounded-full gradient-bg text-white flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <CardTitle>Create Your Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Sign up and create your unique profile. Add your bio, photos, and set your subscription price.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 rounded-full gradient-bg text-white flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <CardTitle>Share Content</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Upload photos, videos, and engage with your audience through posts, messages, and live streams.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 rounded-full gradient-bg text-white flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <CardTitle>Earn Money</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Monetize your content through subscriptions, tips, pay-per-view messages, and more.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are already building their communities and monetizing their content.
          </p>
          
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="gradient-bg text-white px-8 py-3"
                onClick={() => navigate('/register')}
              >
                Start Creating Today
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/login')}
              >
                I Have An Account
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
