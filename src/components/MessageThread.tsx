import { useState, useEffect, useRef } from 'react';
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
  message_id: string | null;
}

interface MessageThreadProps {
  contact: Contact | null;
  onContactUpdate?: () => void;
}

const MessageThread = ({ contact, onContactUpdate }: MessageThreadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contact) {
      fetchMessages();
      
      // Set up real-time subscription for messages
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'whatsapp_messages',
            filter: `contact_id=eq.${contact.id}`
          },
          (payload) => {
            console.log('Real-time message update:', payload);
            fetchMessages(); // Refresh messages when changes occur
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [contact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !contact || sending) return;

    setSending(true);
    try {
      console.log('Starting message send process...');
      
      // Get user's WhatsApp configuration
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('whatsapp_access_token, whatsapp_phone_number_id')
        .eq('id', user?.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      console.log('Profile data:', { 
        hasAccessToken: !!profile?.whatsapp_access_token, 
        hasPhoneNumberId: !!profile?.whatsapp_phone_number_id 
      });

      if (!profile?.whatsapp_access_token || !profile?.whatsapp_phone_number_id) {
        toast({
          title: "WhatsApp Not Configured",
          description: "Please configure your WhatsApp API settings in the WhatsApp Config tab.",
          variant: "destructive",
        });
        return;
      }

      // Format phone number properly for WhatsApp API
      let formattedPhone = contact.whatsapp_id || contact.phone_number;
      if (formattedPhone) {
        // Remove all non-digit characters and any leading + sign
        formattedPhone = formattedPhone.replace(/\D/g, '');
        
        // Ensure it has country code - default to India (91) if 10 digits
        if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
          formattedPhone = '91' + formattedPhone;
        }
      }

      console.log('Sending to phone:', formattedPhone);
      console.log('Message content:', newMessage);

      // Store message in database first
      const { data: messageData, error: dbError } = await supabase
        .from('whatsapp_messages')
        .insert({
          user_id: user?.id,
          contact_id: contact.id,
          content: newMessage,
          direction: 'outbound',
          status: 'sending',
          timestamp: new Date().toISOString(),
          message_type: 'text'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to store message in database');
      }

      console.log('Message stored in database:', messageData);

      // Update UI immediately
      setMessages(prev => [...prev, messageData]);
      setNewMessage('');

      // Prepare WhatsApp API request - Use the latest API version
      const whatsappApiUrl = `https://graph.facebook.com/v21.0/${profile.whatsapp_phone_number_id}/messages`;
      const requestBody = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        text: { body: newMessage }
      };

      console.log('WhatsApp API URL:', whatsappApiUrl);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      console.log('Access token (first 10 chars):', profile.whatsapp_access_token.substring(0, 10) + '...');

      // Send via WhatsApp API
      const response = await fetch(whatsappApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${profile.whatsapp_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('WhatsApp API response status:', response.status);
      
      const responseText = await response.text();
      console.log('WhatsApp API response text:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: { message: responseText } };
        }
        
        console.error('WhatsApp API error response:', errorData);
        
        // Update message status to failed
        await supabase
          .from('whatsapp_messages')
          .update({ status: 'failed' })
          .eq('id', messageData.id);

        // Show specific error message with more details
        let errorMessage = 'Failed to send message';
        
        if (errorData.error) {
          if (errorData.error.error_user_title) {
            errorMessage = errorData.error.error_user_title;
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          }
          
          // Add specific troubleshooting for common errors
          if (errorData.error.code === 190) {
            errorMessage += ' - Please update your access token in WhatsApp Config';
          } else if (errorData.error.code === 131026) {
            errorMessage += ' - Phone number not registered with WhatsApp Business';
          } else if (errorData.error.code === 131047) {
            errorMessage += ' - Message template required for this recipient';
          }
        }
        
        throw new Error(errorMessage);
      }

      const responseData = JSON.parse(responseText);
      console.log('WhatsApp API success response:', responseData);
      
      // Update message status to sent
      await supabase
        .from('whatsapp_messages')
        .update({ 
          status: 'sent',
          message_id: responseData.messages?.[0]?.id
        })
        .eq('id', messageData.id);

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully via WhatsApp.",
      });
      
      // Update contact list if callback provided
      if (onContactUpdate) {
        onContactUpdate();
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      toast({
        title: "Message Failed",
        description: error.message || "Failed to send message. Please check your WhatsApp configuration and ensure your access token is valid.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
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
                        {message.status === 'sending' ? '⏳' : 
                         message.status === 'sent' ? '✓' : 
                         message.status === 'delivered' ? '✓✓' : 
                         message.status === 'read' ? '✓✓' :
                         message.status === 'failed' ? '❌' : '✓'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={handleKeyPress}
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
