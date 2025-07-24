import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Heart, Users, Star, TrendingUp, Search, Filter, Shield, Lock } from "lucide-react";
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
    'Fitness', 'Lifestyle', 'Art', 'Photography', 'Beauty', 'Fashion',
    'Gaming', 'Music', 'Dance', 'Comedy', 'Educational', 'Adult'
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
    { label: "Content Creators", value: "15K+", icon: Users },
    { label: "Premium Content", value: "100K+", icon: Heart },
    { label: "Verified Models", value: "2K+", icon: Star },
    { label: "Monthly Growth", value: "35%", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
      {/* Age Verification Banner */}
      <div className="bg-red-600 text-white text-center py-2 px-4">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">18+ Adult Content Platform - You must be 18 or older to access this site</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
<<<<<<< HEAD:src/pages/Index.tsx
              KikStars
=======
              Fanixora
>>>>>>> 00fd3d273c793926873f254f5e90647b563b5bd8:client/src/pages/Index.tsx
            </span>
          </h1>
          <p className="text-xl text-gray-200 mb-4 max-w-3xl mx-auto">
            The premium adult content platform where creators monetize their exclusive content and connect intimately with their audience.
          </p>
          <p className="text-lg text-pink-200 mb-8 max-w-2xl mx-auto">
            Join thousands of content creators who are building their adult entertainment empire and earning from their passion.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {user ? (
              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-3"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
                {!profile?.is_creator && (
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-white"
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
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-3"
                  onClick={() => navigate('/register')}
                >
                  Join Now (18+)
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-white"
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
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white mb-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-300">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 px-4 bg-black/20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-pink-400/50 text-white placeholder-gray-300"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2 border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-white">
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
              className={selectedCategory === null ? "bg-pink-500 hover:bg-pink-600" : "border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-white"}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-pink-500 hover:bg-pink-600" : "border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-white"}
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
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Featured Creators
            </h2>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              Discover exclusive content from our top-rated adult content creators
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
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
              <p className="text-gray-300 mb-4">No creators found matching your criteria.</p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory(null);
                }}
                className="bg-pink-500 hover:bg-pink-600"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {creators.length > 8 && (
            <div className="text-center mt-8">
              <Button size="lg" variant="outline" className="border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-white">
                View All Creators
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-black/20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-200">
              Start your adult content journey in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center bg-white/10 border-pink-400/50 backdrop-blur-sm">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <CardTitle className="text-white">Create Your Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Sign up and create your unique adult content profile. Add your bio, photos, and set your subscription price.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center bg-white/10 border-pink-400/50 backdrop-blur-sm">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <CardTitle className="text-white">Share Exclusive Content</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Upload premium photos, videos, and engage with your audience through posts, messages, and live streams.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center bg-white/10 border-pink-400/50 backdrop-blur-sm">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <CardTitle className="text-white">Earn Premium Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Monetize your content through subscriptions, tips, pay-per-view messages, and exclusive custom content.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Privacy & Security First
            </h2>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              Your privacy and security are our top priorities. Create and share with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Lock className="h-8 w-8 text-pink-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Secure Content Protection</h3>
                <p className="text-gray-300">Your content is protected with advanced security measures and watermarking technology.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-pink-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Anonymous Payments</h3>
                <p className="text-gray-300">Secure, anonymous payment processing that protects both creators and subscribers.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-pink-900 to-purple-900">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Adult Content Empire?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are already monetizing their adult content and building their fan base.
          </p>
          
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-3"
                onClick={() => navigate('/register')}
              >
                Start Creating Today (18+)
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-white"
                onClick={() => navigate('/login')}
              >
                I Have An Account
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer Disclaimer */}
      <footer className="bg-black py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-gray-400 text-sm mb-2">
            This site contains adult content. You must be 18 years or older to access this website.
          </p>
          <p className="text-gray-500 text-xs">
            By using this site, you acknowledge that you are of legal age and agree to our terms of service.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
