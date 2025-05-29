
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

const WhatsAppMessageTester = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState('');

  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    
    if (phone.startsWith('+')) {
      cleaned = phone.substring(1).replace(/\D/g, '');
    }
    
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    return cleaned;
  };

  const sendDirectMessage = async () => {
    if (!phoneNumber || !message) {
      toast({
        title: "Error",
        description: "Please enter both phone number and message",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get user's WhatsApp configuration
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('whatsapp_access_token, whatsapp_phone_number_id')
        .eq('id', user?.id)
        .single();

      if (profileError) {
        throw new Error('Failed to fetch user profile');
      }

      if (!profile?.whatsapp_access_token || !profile?.whatsapp_phone_number_id) {
        toast({
          title: "WhatsApp Not Configured",
          description: "Please configure your WhatsApp API settings first.",
          variant: "destructive",
        });
        return;
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log('🔍 Sending test message:', {
        to: formattedPhone,
        message: message,
        phoneNumberId: profile.whatsapp_phone_number_id,
        hasToken: !!profile.whatsapp_access_token
      });

      // Direct WhatsApp API call
      const whatsappApiUrl = `https://graph.facebook.com/v21.0/${profile.whatsapp_phone_number_id}/messages`;
      const requestBody = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: { 
          preview_url: false,
          body: message 
        }
      };

      console.log('🌐 API Request:', {
        url: whatsappApiUrl,
        body: requestBody,
        headers: {
          'Authorization': `Bearer ${profile.whatsapp_access_token.substring(0, 20)}...`,
          'Content-Type': 'application/json'
        }
      });

      const response = await fetch(whatsappApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${profile.whatsapp_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();
      console.log('📡 API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      });

      setLastResponse(`Status: ${response.status}\nResponse: ${responseText}`);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: { message: responseText } };
        }

        console.error('❌ WhatsApp API Error:', errorData);
        
        let errorMessage = 'Failed to send message';
        if (errorData.error) {
          if (errorData.error.error_user_title) {
            errorMessage = errorData.error.error_user_title;
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          }
          
          // Common error codes
          if (errorData.error.code === 190) {
            errorMessage += ' - Access token expired or invalid';
          } else if (errorData.error.code === 131026) {
            errorMessage += ' - Phone number not registered with WhatsApp Business';
          } else if (errorData.error.code === 131047) {
            errorMessage += ' - Message template required. Try messaging from WhatsApp first.';
          } else if (errorData.error.code === 131051) {
            errorMessage += ' - Invalid phone number format';
          } else if (errorData.error.code === 131052) {
            errorMessage += ' - User is not a WhatsApp user';
          } else if (errorData.error.code === 100) {
            errorMessage += ' - Invalid phone number or access token';
          } else if (errorData.error.code === 4) {
            errorMessage += ' - Rate limit exceeded';
          }
          
          if (errorData.error.code) {
            errorMessage += ` (Error code: ${errorData.error.code})`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const responseData = JSON.parse(responseText);
      console.log('✅ Success Response:', responseData);
      
      toast({
        title: "Message Sent Successfully",
        description: `Message ID: ${responseData.messages?.[0]?.id || 'Unknown'}`,
      });

    } catch (error: any) {
      console.error('💥 Send message error:', error);
      toast({
        title: "Message Failed",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>WhatsApp Message Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="testPhone">Phone Number (with country code)</Label>
          <Input
            id="testPhone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g., +919876543210 or 919876543210"
          />
          <p className="text-sm text-gray-500 mt-1">
            Formatted: {phoneNumber ? formatPhoneNumber(phoneNumber) : 'Enter phone number'}
          </p>
        </div>
        
        <div>
          <Label htmlFor="testMessage">Message</Label>
          <Input
            id="testMessage"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Test message"
          />
        </div>
        
        <Button 
          onClick={sendDirectMessage} 
          disabled={loading || !phoneNumber || !message}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {loading ? 'Sending...' : 'Send Test Message'}
        </Button>
        
        {lastResponse && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            <strong>Last API Response:</strong>
            <pre className="mt-2 whitespace-pre-wrap">{lastResponse}</pre>
          </div>
        )}
        
        <div className="bg-blue-50 p-4 rounded-lg text-sm">
          <h4 className="font-medium text-blue-900 mb-2">Debugging Tips:</h4>
          <ul className="text-blue-800 space-y-1">
            <li>• Check browser console for detailed logs</li>
            <li>• Verify phone number format (country code + number)</li>
            <li>• Ensure WhatsApp Business API is properly configured</li>
            <li>• Test with your own WhatsApp number first</li>
            <li>• Make sure recipient has WhatsApp installed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppMessageTester;
