
import { MessageSquare, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
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
            <a href="#contact" className="text-gray-600 hover:text-green-600 transition-colors">
              Contact
            </a>
            <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
              Sign In
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Get Started
            </Button>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-green-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 mt-2">
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-gray-600 hover:text-green-600 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-green-600 transition-colors">
                Pricing
              </a>
              <a href="#contact" className="text-gray-600 hover:text-green-600 transition-colors">
                Contact
              </a>
              <div className="flex flex-col space-y-2 pt-2">
                <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                  Sign In
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
