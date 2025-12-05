import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/database';
import { Webhook } from 'svix';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('CLERK_WEBHOOK_SECRET is not set');
}

type EventType = 'user.created' | 'user.updated' | 'user.deleted';

interface Event {
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    username?: string;
  };
  object: 'event';
  type: EventType;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the raw body and headers
    const payload = req.body;
    const svix_id = req.headers['svix-id'] as string;
    const svix_timestamp = req.headers['svix-timestamp'] as string;
    const svix_signature = req.headers['svix-signature'] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: 'Missing svix headers' });
    }

    // Create a new Webhook instance with your webhook secret
    const wh = new Webhook(webhookSecret!);

    // Verify the webhook
    const evt = wh.verify(JSON.stringify(payload), {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as Event;

    const eventType = evt.type;
    const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;

    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim() || username || 'Unknown';

    switch (eventType) {
      case 'user.created':
        // Create user in Supabase
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            clerk_id: id,
            email,
            name,
            avatar_url: image_url || null,
            role: 'user', // Default role
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          return res.status(500).json({ error: 'Failed to create user' });
        }

        // Log the sync
        await supabase
          .from('clerk_sync')
          .insert({
            clerk_user_id: id,
            supabase_user_id: newUser.id,
            synced_at: new Date().toISOString(),
          });

        console.log('User created successfully:', newUser);
        break;

      case 'user.updated':
        // Update user in Supabase
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email,
            name,
            avatar_url: image_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_id', id);

        if (updateError) {
          console.error('Error updating user:', updateError);
          return res.status(500).json({ error: 'Failed to update user' });
        }

        console.log('User updated successfully');
        break;

      case 'user.deleted':
        // Soft delete user in Supabase (or hard delete based on your preference)
        const { error: deleteError } = await supabase
          .from('users')
          .update({
            updated_at: new Date().toISOString(),
            // Add a deleted_at timestamp if you have that field
          })
          .eq('clerk_id', id);

        if (deleteError) {
          console.error('Error deleting user:', deleteError);
          return res.status(500).json({ error: 'Failed to delete user' });
        }

        console.log('User deleted successfully');
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }
}

