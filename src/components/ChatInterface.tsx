
import { useState, useEffect } from "react";
import { Send, Phone, Video, MoreVertical, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string | null;
  direction: string | null;
  timestamp: string | null;
  sender: string;
  avatar?: string;
}

const ChatInterface = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecentMessages();
    } else {
      // Demo messages for non-authenticated users
      setMessages([
        {
          id: "1",
          sender: "customer",
          content: "Hi, I'm interested in your product. Can you tell me more about pricing?",
          timestamp: new Date().toISOString(),
          direction: "inbound",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
        },
        {
          id: "2",
          sender: "bot",
          content: "Hello! I'd be happy to help you with pricing information. We have several plans available starting from $29/month. Would you like me to show you our pricing page?",
          timestamp: new Date().toISOString(),
          direction: "outbound"
        },
        {
          id: "3",
          sender: "customer",
          content: "Yes, that would be great. Also, do you have any discounts for annual plans?",
          timestamp: new Date().toISOString(),
          direction: "inbound",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
        }
      ]);
      setLoading(false);
    }
  }, [user]);

  const fetchRecentMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select(`
          *,
          whatsapp_contacts(name, phone_number, profile_picture_url)
        `)
        .eq('user_id', user?.id)
        .order('timestamp', { ascending: true })
        .limit(50);

      if (error) throw error;

      const formattedMessages = data?.map(msg => ({
        id: msg.id,
        content: msg.content,
        direction: msg.direction,
        timestamp: msg.timestamp,
        sender: msg.direction === 'inbound' ? 'customer' : 'bot',
        avatar: msg.direction === 'inbound' ? msg.whatsapp_contacts?.profile_picture_url : undefined
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      console.log("Sending message:", message);
      // In a real implementation, this would send via WhatsApp API
      setMessage("");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading messages...</div>
        </div>
      </div>
    );
  }

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
            <h3 className="font-semibold text-gray-900">
              {user ? "WhatsApp Chat" : "Demo Chat"}
            </h3>
            <p className="text-sm text-green-600">
              {user ? "Live Chat" : "Demo Mode"}
            </p>
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
        {messages.length === 0 ? (
          <div className="text-center text-gray-500">
            <p>No messages yet</p>
            {user && <p className="text-sm">Messages will appear here when you receive them</p>}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${msg.direction === 'inbound' ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
                {msg.direction === 'inbound' && (
                  <img
                    src={msg.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    msg.direction === 'inbound'
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.direction === 'inbound' ? 'text-gray-500' : 'text-green-100'}`}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
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
              placeholder={user ? "Type a message..." : "Demo mode - messages won't be sent"}
              className="pr-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
              disabled={!user}
            />
            <Button type="button" size="sm" variant="ghost" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-green-600">
              <Smile className="w-4 h-4" />
            </Button>
          </div>
          <Button
            type="submit"
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={!message.trim() || !user}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
