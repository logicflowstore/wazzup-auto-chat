import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Settings, Send, LogOut, Inbox, Copy, ExternalLink } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import InboxInterface from '@/components/InboxInterface';
import WhatsAppMessageTester from '@/components/WhatsAppMessageTester';

interface Profile {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  whatsapp_business_account_id: string | null;
  whatsapp_phone_number_id: string | null;
  whatsapp_access_token: string | null;
}

interface WhatsAppMessage {
  id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  contact_id: string;
  status: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inbox');
  const [whatsappConfig, setWhatsappConfig] = useState({
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: ''
  });
  const [messageToSend, setMessageToSend] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const webhookUrl = 'https://qionpicrrboyktnsilgg.supabase.co/functions/v1/whatsapp-webhook';

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setWhatsappConfig({
          accessToken: data.whatsapp_access_token || '',
          phoneNumberId: data.whatsapp_phone_number_id || '',
          businessAccountId: data.whatsapp_business_account_id || ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const updateWhatsAppConfig = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          whatsapp_access_token: whatsappConfig.accessToken,
          whatsapp_phone_number_id: whatsappConfig.phoneNumberId,
          whatsapp_business_account_id: whatsappConfig.businessAccountId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "WhatsApp Configuration Updated",
        description: "Your WhatsApp API settings have been saved.",
      });

      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendWhatsAppMessage = async () => {
    if (!whatsappConfig.accessToken || !whatsappConfig.phoneNumberId || !messageToSend || !recipientPhone) {
      toast({
        title: "Missing Information",
        description: "Please configure WhatsApp API and provide recipient phone number and message.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Store message in database
      const { error: dbError } = await supabase
        .from('whatsapp_messages')
        .insert({
          user_id: user?.id,
          content: messageToSend,
          direction: 'outbound',
          status: 'sending'
        });

      if (dbError) throw dbError;

      // Send via WhatsApp API
      const response = await fetch(`https://graph.facebook.com/v17.0/${whatsappConfig.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappConfig.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipientPhone,
          text: { body: messageToSend }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send WhatsApp message');
      }

      toast({
        title: "Message Sent",
        description: "Your WhatsApp message has been sent successfully.",
      });

      setMessageToSend('');
      setRecipientPhone('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6">
        <div className="flex items-center mb-8">
          <MessageSquare className="w-8 h-8 text-green-600 mr-2" />
          <h1 className="text-xl font-bold">WazzupChat</h1>
        </div>
        
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`w-full flex items-center px-4 py-2 rounded-lg font-medium ${
              activeTab === 'inbox' ? 'text-green-600 bg-green-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Inbox className="w-5 h-5 mr-3" />
            Inbox
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center px-4 py-2 rounded-lg font-medium ${
              activeTab === 'chat' ? 'text-green-600 bg-green-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-5 h-5 mr-3" />
            Live Chat
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`w-full flex items-center px-4 py-2 rounded-lg font-medium ${
              activeTab === 'test' ? 'text-green-600 bg-green-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Send className="w-5 h-5 mr-3" />
            Test Messages
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center px-4 py-2 rounded-lg font-medium ${
              activeTab === 'settings' ? 'text-green-600 bg-green-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-5 h-5 mr-3" />
            WhatsApp Config
          </button>
          <button
            onClick={() => setActiveTab('send')}
            className={`w-full flex items-center px-4 py-2 rounded-lg font-medium ${
              activeTab === 'send' ? 'text-green-600 bg-green-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Send className="w-5 h-5 mr-3" />
            Send Message
          </button>
        </nav>

        <div className="mt-auto pt-6">
          <Button onClick={handleSignOut} variant="outline" className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTab === 'inbox' && 'Inbox'}
            {activeTab === 'chat' && 'Live Chat'}
            {activeTab === 'test' && 'Message Testing'}
            {activeTab === 'settings' && 'WhatsApp Configuration'}
            {activeTab === 'send' && 'Send WhatsApp Message'}
          </h2>
          <p className="text-gray-600">Welcome back, {profile?.full_name || user?.email}</p>
        </div>

        <div className="flex-1 p-6">
          {activeTab === 'inbox' && (
            <div className="h-full">
              <InboxInterface />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="h-full">
              <ChatInterface />
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-6">
              <WhatsAppMessageTester />
              
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle>Webhook Validation Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">Common Webhook Validation Problems:</h4>
                      <ul className="text-yellow-800 space-y-1 list-disc list-inside">
                        <li><strong>HTTPS Required:</strong> Facebook requires HTTPS webhooks</li>
                        <li><strong>Verify Token Mismatch:</strong> Must match exactly "whatsapp_webhook_verify_token"</li>
                        <li><strong>Response Format:</strong> Must return the challenge parameter as plain text</li>
                        <li><strong>Response Time:</strong> Must respond within 20 seconds</li>
                        <li><strong>Status Code:</strong> Must return 200 status code</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Check These Settings:</h4>
                      <ul className="text-blue-800 space-y-1 list-disc list-inside">
                        <li>Webhook URL: https://qionpicrrboyktnsilgg.supabase.co/functions/v1/whatsapp-webhook</li>
                        <li>Verify Token: whatsapp_webhook_verify_token</li>
                        <li>Subscribed Fields: messages</li>
                        <li>App must be in Live mode (not Development)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle>WhatsApp Business API Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="accessToken">Access Token</Label>
                    <Input
                      id="accessToken"
                      type="password"
                      value={whatsappConfig.accessToken}
                      onChange={(e) => setWhatsappConfig({...whatsappConfig, accessToken: e.target.value})}
                      placeholder="Your WhatsApp Business API Access Token"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                    <Input
                      id="phoneNumberId"
                      value={whatsappConfig.phoneNumberId}
                      onChange={(e) => setWhatsappConfig({...whatsappConfig, phoneNumberId: e.target.value})}
                      placeholder="Your WhatsApp Phone Number ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessAccountId">Business Account ID</Label>
                    <Input
                      id="businessAccountId"
                      value={whatsappConfig.businessAccountId}
                      onChange={(e) => setWhatsappConfig({...whatsappConfig, businessAccountId: e.target.value})}
                      placeholder="Your WhatsApp Business Account ID"
                    />
                  </div>
                  <Button onClick={updateWhatsAppConfig} className="w-full">
                    Save Configuration
                  </Button>
                </CardContent>
              </Card>

              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle>Webhook Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Webhook URL</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={webhookUrl}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(webhookUrl)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Use this URL in your Facebook App webhook configuration
                    </p>
                  </div>
                  
                  <div>
                    <Label>Verify Token</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value="whatsapp_webhook_verify_token"
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard('whatsapp_webhook_verify_token')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Use this verify token in your Facebook App webhook settings
                    </p>
                  </div>

                  <div>
                    <Label>Callback URL for Facebook Login</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value="https://qionpicrrboyktnsilgg.supabase.co/auth/v1/callback"
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard('https://qionpicrrboyktnsilgg.supabase.co/auth/v1/callback')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Add this as a redirect URI in your Facebook App OAuth settings
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Go to your Facebook App Dashboard</li>
                      <li>Add the webhook URL and verify token</li>
                      <li>Subscribe to 'messages' webhook fields</li>
                      <li>Add the callback URL to OAuth redirect URIs</li>
                      <li>Test your configuration</li>
                    </ol>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Facebook Developer Console
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'send' && (
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Send WhatsApp Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipientPhone">Recipient Phone Number</Label>
                  <Input
                    id="recipientPhone"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="Phone number with country code (e.g., +1234567890)"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    value={messageToSend}
                    onChange={(e) => setMessageToSend(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full p-3 border border-gray-300 rounded-md min-h-[100px] resize-vertical"
                  />
                </div>
                <Button onClick={sendWhatsAppMessage} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
