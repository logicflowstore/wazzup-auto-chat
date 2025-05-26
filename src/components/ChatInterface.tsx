
import { useState } from "react";
import { Send, Phone, Video, MoreVertical, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ChatInterface = () => {
  const [message, setMessage] = useState("");

  const messages = [
    {
      id: 1,
      sender: "customer",
      content: "Hi, I'm interested in your product. Can you tell me more about pricing?",
      timestamp: "10:30 AM",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
    },
    {
      id: 2,
      sender: "bot",
      content: "Hello! I'd be happy to help you with pricing information. We have several plans available starting from $29/month. Would you like me to show you our pricing page?",
      timestamp: "10:31 AM"
    },
    {
      id: 3,
      sender: "customer",
      content: "Yes, that would be great. Also, do you have any discounts for annual plans?",
      timestamp: "10:32 AM",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
    }
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
            alt="Contact"
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-gray-900">John Doe</h3>
            <p className="text-sm text-green-600">Online</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" className="text-gray-600 hover:text-green-600">
            <Phone className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-gray-600 hover:text-green-600">
            <Video className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-gray-600 hover:text-green-600">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${msg.sender === 'customer' ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
              {msg.sender === 'customer' && (
                <img
                  src={msg.avatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div
                className={`px-4 py-2 rounded-2xl ${
                  msg.sender === 'customer'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-green-600 text-white'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'customer' ? 'text-gray-500' : 'text-green-100'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Button type="button" size="sm" variant="ghost" className="text-gray-600 hover:text-green-600">
            <Paperclip className="w-4 h-4" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="pr-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
            />
            <Button type="button" size="sm" variant="ghost" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-green-600">
              <Smile className="w-4 h-4" />
            </Button>
          </div>
          <Button
            type="submit"
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={!message.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
