
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, Upload, UserPlus } from 'lucide-react';

const ContactManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);

  const addContact = async () => {
    if (!newContact.name || !newContact.phone || adding) return;

    setAdding(true);
    try {
      // Clean phone number format - remove all non-digit characters
      const cleanPhone = newContact.phone.replace(/\D/g, '');
      
      // Format for WhatsApp API (ensure country code)
      let formattedPhone = cleanPhone;
      if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
        formattedPhone = '91' + cleanPhone;
      }
      
      // Add + prefix for display
      const displayPhone = '+' + formattedPhone;

      console.log('Adding contact:', {
        original: newContact.phone,
        cleaned: cleanPhone,
        formatted: formattedPhone,
        display: displayPhone
      });

      const { error } = await supabase
        .from('whatsapp_contacts')
        .insert({
          user_id: user?.id,
          name: newContact.name,
          phone_number: displayPhone,
          whatsapp_id: formattedPhone,
        });

      if (error) throw error;

      toast({
        title: "Contact Added",
        description: "Contact has been added successfully.",
      });

      setNewContact({ name: '', phone: '' });
    } catch (error: any) {
      console.error('Add contact error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
    }
  };

  const importCsvContacts = async () => {
    if (!csvFile || importing) return;

    setImporting(true);
    try {
      const text = await csvFile.text();
      const lines = text.split('\n');
      const contacts = [];

      console.log('Processing CSV with', lines.length, 'lines');

      // Skip header row, process data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [name, phone] = line.split(',').map(item => item.trim().replace(/"/g, ''));
        if (name && phone) {
          // Clean phone number format
          const cleanPhone = phone.replace(/\D/g, '');
          
          // Format for WhatsApp API
          let formattedPhone = cleanPhone;
          if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
            formattedPhone = '91' + cleanPhone;
          }
          
          // Add + prefix for display
          const displayPhone = '+' + formattedPhone;
          
          contacts.push({
            user_id: user?.id,
            name,
            phone_number: displayPhone,
            whatsapp_id: formattedPhone,
          });
        }
      }

      console.log('Processed contacts:', contacts);

      if (contacts.length === 0) {
        throw new Error('No valid contacts found in CSV');
      }

      const { error } = await supabase
        .from('whatsapp_contacts')
        .insert(contacts);

      if (error) throw error;

      toast({
        title: "Import Successful",
        description: `${contacts.length} contacts imported successfully.`,
      });

      setCsvFile(null);
      // Reset file input
      const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('CSV import error:', error);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Single Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Add New Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="contact-name">Name</Label>
            <Input
              id="contact-name"
              value={newContact.name}
              onChange={(e) => setNewContact({...newContact, name: e.target.value})}
              placeholder="Contact name"
            />
          </div>
          <div>
            <Label htmlFor="contact-phone">Phone Number</Label>
            <Input
              id="contact-phone"
              value={newContact.phone}
              onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
              placeholder="+917666946282 or 7666946282"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter with or without country code. We'll format it automatically for India (+91).
            </p>
          </div>
          <Button onClick={addContact} disabled={!newContact.name || !newContact.phone || adding}>
            <UserPlus className="w-4 h-4 mr-2" />
            {adding ? 'Adding...' : 'Add Contact'}
          </Button>
        </CardContent>
      </Card>

      {/* Import from CSV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Import from CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csv-upload">CSV File</Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
            />
            <p className="text-sm text-gray-500 mt-1">
              CSV format: name,phone (with header row). Phone numbers will be automatically formatted for India (+91).
            </p>
          </div>
          {csvFile && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm">Selected: {csvFile.name}</p>
            </div>
          )}
          <Button onClick={importCsvContacts} disabled={!csvFile || importing}>
            <Upload className="w-4 h-4 mr-2" />
            {importing ? 'Importing...' : 'Import Contacts'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactManager;
