
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-green-600 mr-2" />
            <span className="text-xl font-bold text-gray-900">WazzupChat</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-green-600 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-green-600 transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-gray-600 hover:text-green-600 transition-colors">
              About
            </a>
            <a href="#contact" className="text-gray-600 hover:text-green-600 transition-colors">
              Contact
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="ghost"
                  className="text-gray-700 hover:text-green-600"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => navigate('/auth')}
                  variant="ghost"
                  className="text-gray-700 hover:text-green-600"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/auth')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              <a
                href="#features"
                className="block px-3 py-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="block px-3 py-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#about"
                className="block px-3 py-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                About
              </a>
              <a
                href="#contact"
                className="block px-3 py-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                Contact
              </a>
              
              <div className="pt-4 space-y-2">
                {user ? (
                  <>
                    <Button
                      onClick={() => navigate('/dashboard')}
                      variant="outline"
                      className="w-full"
                    >
                      Dashboard
                    </Button>
                    <Button
                      onClick={handleSignOut}
                      variant="ghost"
                      className="w-full"
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => navigate('/auth')}
                      variant="outline"
                      className="w-full"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={() => navigate('/auth')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
