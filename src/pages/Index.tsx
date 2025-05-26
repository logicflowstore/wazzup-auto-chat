
import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import AuthModal from "@/components/AuthModal";
import ChatInterface from "@/components/ChatInterface";

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {!showDashboard ? (
        <>
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
                  onClick={() => {
                    setAuthMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Start Your Free Trial
                </button>
              </div>
            </div>
          </section>
        </>
      ) : (
        <div className="flex h-screen bg-gray-50">
          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-gray-200 p-6">
            <nav className="space-y-2">
              <a href="#" className="flex items-center px-4 py-2 text-green-600 bg-green-50 rounded-lg font-medium">
                Conversations
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                Contacts
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                Automations
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                Analytics
              </a>
            </nav>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="bg-white border-b border-gray-200 p-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex-1 p-6">
              <div className="h-full">
                <ChatInterface />
              </div>
            </div>
          </div>
        </div>
      )}

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
