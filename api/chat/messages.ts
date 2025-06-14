import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { thread_id, user_id } = req.query;
    
    if (!thread_id || typeof thread_id !== 'string') {
      return res.status(400).json({ error: 'thread_id is required' });
    }

    if (!supabaseAdmin) {
      // Return empty array if Supabase is not configured
      console.warn('Supabase not configured, returning empty messages');
      return res.json([]);
    }

    // Build query
    let query = supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('thread_id', thread_id)
      .order('created_at', { ascending: true });

    // Note: user_id filtering is done via thread_id since chat_messages doesn't have user_id column
    // The user_id is stored in metadata instead

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch messages',
        details: error.message 
      });
    }

    // Transform messages to match frontend format
    const messages = (data || []).map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      role: msg.role,
      timestamp: msg.created_at,
      metadata: msg.metadata
    }));

    return res.json(messages);
  } catch (error: any) {
    console.error('Get messages error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}