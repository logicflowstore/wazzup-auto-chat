
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import AuthModal from "@/components/AuthModal";
import ChatInterface from "@/components/ChatInterface";

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is logged in, redirect to dashboard
  if (user) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      
      {/* Demo Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience our intuitive chat interface and see how easy it is to manage customer conversations.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                <h3 className="text-lg font-semibold">Live Chat Demo</h3>
                <p className="text-green-100 text-sm">Interactive preview of our chat interface</p>
              </div>
              <div className="h-96">
                <ChatInterface />
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/auth')}
              className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              Start Your Free Trial
            </button>
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};

export default Index;
