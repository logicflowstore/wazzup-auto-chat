
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'GET') {
      // Webhook verification for Facebook
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')
      
      console.log('Webhook verification:', { mode, token, challenge })
      
      // You should set a verify token in your Facebook app settings
      const VERIFY_TOKEN = 'whatsapp_webhook_verify_token'
      
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified successfully')
        return new Response(challenge, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        })
      } else {
        console.log('Webhook verification failed')
        return new Response('Forbidden', { status: 403 })
      }
    }

    if (req.method === 'POST') {
      const body = await req.json()
      console.log('Webhook received:', JSON.stringify(body, null, 2))

      // Process WhatsApp webhook events
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            if (change.field === 'messages') {
              const value = change.value
              
              // Handle incoming messages
              if (value.messages) {
                for (const message of value.messages) {
                  await handleIncomingMessage(supabaseClient, message, value)
                }
              }
              
              // Handle message status updates (delivered, read, etc.)
              if (value.statuses) {
                for (const status of value.statuses) {
                  await handleMessageStatus(supabaseClient, status)
                }
              }
            }
          }
        }
      }

      return new Response('OK', { 
        status: 200,
        headers: corsHeaders
      })
    }

    return new Response('Method not allowed', { status: 405 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal Server Error', { 
      status: 500,
      headers: corsHeaders
    })
  }
})

async function handleIncomingMessage(supabaseClient: any, message: any, value: any) {
  console.log('Processing incoming message:', message)
  
  try {
    const phoneNumber = message.from
    const messageContent = message.text?.body || message.type
    
    // Find or create contact
    let { data: contact, error: contactError } = await supabaseClient
      .from('whatsapp_contacts')
      .select('*')
      .eq('whatsapp_id', phoneNumber)
      .single()
    
    if (contactError && contactError.code === 'PGRST116') {
      // Contact doesn't exist, create it
      const { data: newContact, error: createError } = await supabaseClient
        .from('whatsapp_contacts')
        .insert({
          whatsapp_id: phoneNumber,
          phone_number: '+' + phoneNumber,
          name: phoneNumber // Will be updated when user sets a name
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating contact:', createError)
        return
      }
      contact = newContact
    } else if (contactError) {
      console.error('Error finding contact:', contactError)
      return
    }
    
    // Store the message
    const { error: messageError } = await supabaseClient
      .from('whatsapp_messages')
      .insert({
        contact_id: contact.id,
        user_id: contact.user_id,
        message_id: message.id,
        content: messageContent,
        direction: 'inbound',
        status: 'received',
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        message_type: message.type || 'text'
      })
    
    if (messageError) {
      console.error('Error storing message:', messageError)
    } else {
      console.log('Message stored successfully')
    }
  } catch (error) {
    console.error('Error handling incoming message:', error)
  }
}

async function handleMessageStatus(supabaseClient: any, status: any) {
  console.log('Processing message status:', status)
  
  try {
    const { error } = await supabaseClient
      .from('whatsapp_messages')
      .update({ 
        status: status.status,
        timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString()
      })
      .eq('message_id', status.id)
    
    if (error) {
      console.error('Error updating message status:', error)
    } else {
      console.log('Message status updated:', status.status)
    }
  } catch (error) {
    console.error('Error handling message status:', error)
  }
}
