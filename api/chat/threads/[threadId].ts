import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Serverless function environment check:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceRoleKey,
  urlPreview: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'NOT SET'
});

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
  console.log('Thread API called:', {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request handled');
    res.status(200).end();
    return;
  }

  const { threadId } = req.query;
  
  if (!threadId || typeof threadId !== 'string') {
    console.error('Missing threadId in request');
    return res.status(400).json({ error: 'threadId is required' });
  }

  // GET - Fetch thread with messages
  if (req.method === 'GET') {
    try {
      const { user_id } = req.query;
      
      if (!supabaseAdmin) {
        console.log('Supabase not configured, returning mock data');
        // Return mock data if Supabase is not configured
        return res.json({
          thread_id: threadId,
          user_id: user_id || 'anonymous',
          title: 'Conversation',
          messages: []
        });
      }

      // First get the thread
      const { data: threadData, error: threadError } = await supabaseAdmin
        .from('chat_threads')
        .select('*')
        .eq('thread_id', threadId)
        .single();

      if (threadError || !threadData) {
        console.error('Thread not found:', {
          threadId,
          user_id,
          error: threadError,
          data: threadData
        });
        return res.status(404).json({ 
          error: 'Thread not found',
          details: threadError?.message || 'No thread data returned',
          threadId,
          user_id
        });
      }

      // Then get messages for this thread
      const { data: messages, error: messagesError } = await supabaseAdmin
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        threadData.messages = [];
      } else {
        threadData.messages = messages || [];
      }

      return res.json(threadData);
    } catch (error) {
      console.error('Error fetching thread:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // DELETE - Delete thread
  if (req.method === 'DELETE') {
    try {
      if (!supabaseAdmin) {
        return res.json({ success: true });
      }

      // Messages will be cascade deleted due to foreign key constraint
      const { error } = await supabaseAdmin
        .from('chat_threads')
        .delete()
        .eq('thread_id', threadId);

      if (error) {
        console.error('Error deleting thread:', error);
        return res.status(500).json({ 
          error: 'Failed to delete thread',
          details: error.message 
        });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting thread:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}