
import { useState } from 'react';
import ContactsList from './ContactsList';
import MessageThread from './MessageThread';

interface Contact {
  id: string;
  name: string | null;
  phone_number: string | null;
  profile_picture_url: string | null;
  whatsapp_id: string;
}

const InboxInterface = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <ContactsList 
          onSelectContact={setSelectedContact}
          selectedContactId={selectedContact?.id || null}
        />
      </div>
      <div className="lg:col-span-2">
        <MessageThread contact={selectedContact} />
      </div>
    </div>
  );
};

export default InboxInterface;
