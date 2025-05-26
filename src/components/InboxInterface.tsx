
import { useState } from 'react';
import ContactsList from './ContactsList';
import MessageThread from './MessageThread';
import ContactManager from './ContactManager';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare } from 'lucide-react';

interface Contact {
  id: string;
  name: string | null;
  phone_number: string | null;
  profile_picture_url: string | null;
  whatsapp_id: string;
}

const InboxInterface = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeView, setActiveView] = useState<'inbox' | 'contacts'>('inbox');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleContactUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="h-full space-y-4">
      {/* View Toggle */}
      <div className="flex space-x-2">
        <Button
          variant={activeView === 'inbox' ? 'default' : 'outline'}
          onClick={() => setActiveView('inbox')}
          className="flex items-center"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Messages
        </Button>
        <Button
          variant={activeView === 'contacts' ? 'default' : 'outline'}
          onClick={() => setActiveView('contacts')}
          className="flex items-center"
        >
          <Users className="w-4 h-4 mr-2" />
          Manage Contacts
        </Button>
      </div>

      {activeView === 'inbox' ? (
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ContactsList 
              onSelectContact={setSelectedContact}
              selectedContactId={selectedContact?.id || null}
              refreshTrigger={refreshTrigger}
            />
          </div>
          <div className="lg:col-span-2">
            <MessageThread 
              contact={selectedContact} 
              onContactUpdate={handleContactUpdate}
            />
          </div>
        </div>
      ) : (
        <ContactManager />
      )}
    </div>
  );
};

export default InboxInterface;
