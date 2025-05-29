
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log(`Webhook received: ${req.method} ${req.url}`)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
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
      
      console.log('Webhook verification attempt:', { 
        mode, 
        token, 
        challenge,
        expectedToken: 'whatsapp_webhook_verify_token',
        url: req.url,
        searchParams: Object.fromEntries(url.searchParams.entries())
      })
      
      const VERIFY_TOKEN = 'whatsapp_webhook_verify_token'
      
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully - returning challenge:', challenge)
        return new Response(challenge, { 
          status: 200,
          headers: { 
            'Content-Type': 'text/plain',
            ...corsHeaders 
          }
        })
      } else {
        console.log('❌ Webhook verification failed:', { 
          modeMatch: mode === 'subscribe',
          tokenMatch: token === VERIFY_TOKEN,
          receivedMode: mode,
          receivedToken: token,
          expectedToken: VERIFY_TOKEN
        })
        return new Response('Verification failed', { 
          status: 403,
          headers: corsHeaders
        })
      }
    }

    if (req.method === 'POST') {
      const body = await req.json()
      console.log('📨 Webhook POST received:', JSON.stringify(body, null, 2))

      // Process WhatsApp webhook events
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry || []) {
          console.log('📋 Processing entry:', entry.id)
          
          for (const change of entry.changes || []) {
            console.log('🔄 Processing change:', change.field)
            
            if (change.field === 'messages') {
              const value = change.value
              console.log('💬 Message value received:', JSON.stringify(value, null, 2))
              
              // Handle incoming messages
              if (value.messages && value.messages.length > 0) {
                for (const message of value.messages) {
                  console.log('📥 Processing incoming message:', message.id)
                  await handleIncomingMessage(supabaseClient, message, value)
                }
              }
              
              // Handle message status updates (delivered, read, etc.)
              if (value.statuses && value.statuses.length > 0) {
                for (const status of value.statuses) {
                  console.log('📊 Processing message status:', status.id, status.status)
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

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    })
  } catch (error) {
    console.error('💥 Webhook error:', error)
    return new Response(`Internal Server Error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders
    })
  }
})

async function handleIncomingMessage(supabaseClient: any, message: any, value: any) {
  console.log('📨 Processing incoming message:', JSON.stringify(message, null, 2))
  
  try {
    const phoneNumber = message.from
    const messageContent = message.text?.body || message.type || 'Media message'
    
    // Find the user based on the phone number ID from the webhook metadata
    const phoneNumberId = value.metadata?.phone_number_id
    console.log('🔍 Looking for user with phone_number_id:', phoneNumberId)
    
    if (!phoneNumberId) {
      console.error('❌ No phone_number_id found in webhook metadata')
      return
    }

    // Find user by their WhatsApp phone number ID
    const { data: userProfile, error: userError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('whatsapp_phone_number_id', phoneNumberId)
      .maybeSingle()
    
    if (userError) {
      console.error('❌ Error finding user by phone_number_id:', userError)
      return
    }

    if (!userProfile) {
      console.error('❌ No user found with phone_number_id:', phoneNumberId)
      return
    }

    console.log('✅ Found user profile:', userProfile.id)
    
    // Find or create contact
    let { data: contact, error: contactError } = await supabaseClient
      .from('whatsapp_contacts')
      .select('*')
      .eq('whatsapp_id', phoneNumber)
      .eq('user_id', userProfile.id)
      .maybeSingle()
    
    if (!contact && contactError?.code !== 'PGRST116') {
      console.error('❌ Error finding contact:', contactError)
      return
    }
    
    if (!contact) {
      // Contact doesn't exist, create it
      const { data: newContact, error: createError } = await supabaseClient
        .from('whatsapp_contacts')
        .insert({
          user_id: userProfile.id,
          whatsapp_id: phoneNumber,
          phone_number: '+' + phoneNumber,
          name: phoneNumber // Will be updated when user sets a name
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Error creating contact:', createError)
        return
      }
      contact = newContact
      console.log('✅ Created new contact:', contact.id)
    }
    
    // Store the message
    const { error: messageError } = await supabaseClient
      .from('whatsapp_messages')
      .insert({
        contact_id: contact.id,
        user_id: userProfile.id,
        message_id: message.id,
        content: messageContent,
        direction: 'inbound',
        status: 'received',
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        message_type: message.type || 'text'
      })
    
    if (messageError) {
      console.error('❌ Error storing message:', messageError)
    } else {
      console.log('✅ Message stored successfully for user:', userProfile.id)
    }
  } catch (error) {
    console.error('💥 Error handling incoming message:', error)
  }
}

async function handleMessageStatus(supabaseClient: any, status: any) {
  console.log('📊 Processing message status:', JSON.stringify(status, null, 2))
  
  try {
    const { error } = await supabaseClient
      .from('whatsapp_messages')
      .update({ 
        status: status.status,
        timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString()
      })
      .eq('message_id', status.id)
    
    if (error) {
      console.error('❌ Error updating message status:', error)
    } else {
      console.log('✅ Message status updated:', status.status)
    }
  } catch (error) {
    console.error('💥 Error handling message status:', error)
  }
}
