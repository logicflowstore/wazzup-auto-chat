
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Phone } from 'lucide-react';

interface Contact {
  id: string;
  name: string | null;
  phone_number: string | null;
  profile_picture_url: string | null;
  whatsapp_id: string;
}

interface ContactsListProps {
  onSelectContact: (contact: Contact) => void;
  selectedContactId: string | null;
}

const ContactsList = ({ onSelectContact, selectedContactId }: ContactsListProps) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Loading contacts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Contacts ({contacts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {contacts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No contacts yet</p>
              <p className="text-sm">Contacts will appear here when you receive messages</p>
            </div>
          ) : (
            contacts.map((contact) => (
              <Button
                key={contact.id}
                variant={selectedContactId === contact.id ? "secondary" : "ghost"}
                className="w-full justify-start p-4 h-auto"
                onClick={() => onSelectContact(contact)}
              >
                <Avatar className="w-10 h-10 mr-3">
                  <AvatarImage src={contact.profile_picture_url || undefined} />
                  <AvatarFallback>
                    {contact.name ? contact.name.charAt(0).toUpperCase() : <Phone className="w-5 h-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="font-medium">
                    {contact.name || contact.phone_number || 'Unknown Contact'}
                  </div>
                  {contact.phone_number && (
                    <div className="text-sm text-gray-500">{contact.phone_number}</div>
                  )}
                </div>
              </Button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactsList;
