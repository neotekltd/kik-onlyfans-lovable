
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Users, DollarSign, Shield, Camera, MessageCircle } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: <Camera className="h-8 w-8 text-brand-500" />,
      title: "Premium Content",
      description: "Share exclusive photos, videos, and content with your audience"
    },
    {
      icon: <DollarSign className="h-8 w-8 text-creator-500" />,
      title: "Monetize Your Passion",
      description: "Earn through subscriptions, tips, and pay-per-view content"
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-brand-500" />,
      title: "Direct Messaging",
      description: "Connect privately with your fans through secure messaging"
    },
    {
      icon: <Shield className="h-8 w-8 text-creator-500" />,
      title: "Secure Platform",
      description: "Age verification, secure payments, and content protection"
    },
    {
      icon: <Users className="h-8 w-8 text-brand-500" />,
      title: "Grow Your Audience",
      description: "Build a loyal fanbase and grow your community"
    },
    {
      icon: <Heart className="h-8 w-8 text-creator-500" />,
      title: "Creator-First",
      description: "Designed by creators, for creators. You're in control"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-creator-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-creator-600/10 to-brand-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 animate-fade-in">
              Kik<span className="gradient-bg bg-clip-text text-transparent">Only</span><span className="gradient-creator bg-clip-text text-transparent">Fans</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto animate-fade-in">
              The premium content platform where creators thrive and fans connect. Join thousands of creators earning from their passion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4 gradient-bg hover:opacity-90 transition-all duration-300 transform hover:scale-105"
                onClick={() => navigate('/register')}
              >
                Start Creating
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-4 border-2 border-creator-500 text-creator-600 hover:bg-creator-500 hover:text-white transition-all duration-300"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-gray-600">Powerful tools and features designed for modern content creators</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-gray-50">
                <CardContent className="p-8 text-center">
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gradient-to-r from-brand-600 to-creator-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
            <div className="animate-pulse-gentle">
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-xl opacity-90">Active Creators</div>
            </div>
            <div className="animate-pulse-gentle" style={{ animationDelay: '0.5s' }}>
              <div className="text-4xl font-bold mb-2">$2M+</div>
              <div className="text-xl opacity-90">Creator Earnings</div>
            </div>
            <div className="animate-pulse-gentle" style={{ animationDelay: '1s' }}>
              <div className="text-4xl font-bold mb-2">500K+</div>
              <div className="text-xl opacity-90">Happy Subscribers</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of creators who are already earning from their content on KikOnlyFans.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-4 gradient-creator hover:opacity-90 transition-all duration-300 transform hover:scale-105"
            onClick={() => navigate('/register')}
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
