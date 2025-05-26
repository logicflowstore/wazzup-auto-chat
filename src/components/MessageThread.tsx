
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Contact {
  id: string;
  name: string | null;
  phone_number: string | null;
  profile_picture_url: string | null;
  whatsapp_id: string;
}

interface Message {
  id: string;
  content: string | null;
  direction: string | null;
  status: string | null;
  timestamp: string | null;
  created_at: string | null;
}

interface MessageThreadProps {
  contact: Contact | null;
}

const MessageThread = ({ contact }: MessageThreadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (contact) {
      fetchMessages();
    }
  }, [contact]);

  const fetchMessages = async () => {
    if (!contact) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('contact_id', contact.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !contact || sending) return;

    setSending(true);
    try {
      // Get user's WhatsApp configuration
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('whatsapp_access_token, whatsapp_phone_number_id')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.whatsapp_access_token || !profile?.whatsapp_phone_number_id) {
        toast({
          title: "WhatsApp Not Configured",
          description: "Please configure your WhatsApp API settings first.",
          variant: "destructive",
        });
        return;
      }

      // Store message in database first
      const { error: dbError } = await supabase
        .from('whatsapp_messages')
        .insert({
          user_id: user?.id,
          contact_id: contact.id,
          content: newMessage,
          direction: 'outbound',
          status: 'sending'
        });

      if (dbError) throw dbError;

      // Send via WhatsApp API
      const response = await fetch(`https://graph.facebook.com/v17.0/${profile.whatsapp_phone_number_id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${profile.whatsapp_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: contact.phone_number,
          text: { body: newMessage }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send WhatsApp message');
      }

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });

      setNewMessage('');
      fetchMessages(); // Refresh messages
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (!contact) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <Phone className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Select a contact to start messaging</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center">
          <Avatar className="w-8 h-8 mr-3">
            <AvatarImage src={contact.profile_picture_url || undefined} />
            <AvatarFallback>
              {contact.name ? contact.name.charAt(0).toUpperCase() : <Phone className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {contact.name || contact.phone_number || 'Unknown Contact'}
            </div>
            {contact.phone_number && contact.name && (
              <div className="text-sm text-gray-500 font-normal">{contact.phone_number}</div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.direction === 'outbound'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.direction === 'outbound' ? 'text-green-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                    {message.direction === 'outbound' && (
                      <span className="ml-1">
                        {message.status === 'sending' ? '⏳' : '✓'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageThread;
