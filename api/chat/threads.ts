import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client for Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log initialization for debugging
console.log('Initializing Supabase in Vercel function:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceRoleKey,
  url: supabaseUrl || 'NOT SET',
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

  if (req.method === 'POST') {
    try {
      const { user_id, thread_id, title } = req.body;
      
      console.log('POST /api/chat/threads - Creating thread:', { user_id, thread_id, title });
      
      if (!user_id || !thread_id) {
        return res.status(400).json({ error: "user_id and thread_id are required" });
      }
      
      if (!supabaseAdmin) {
        console.error('❌ Supabase admin client is not initialized');
        return res.status(500).json({ 
          error: "Database connection not configured",
          details: "Supabase environment variables not set in Vercel"
        });
      }
      
      const { data, error } = await supabaseAdmin
        .from('chat_threads')
        .insert({
          user_id,
          thread_id,
          title: title || 'New Chat',
          metadata: {}
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating chat thread:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return res.status(500).json({ 
          error: "Failed to create thread",
          code: error.code,
          message: error.message,
          details: error.details
        });
      }
      
      console.log('✅ Thread created successfully:', data);
      return res.json(data);
    } catch (error) {
      console.error("Create thread endpoint error:", error);
      return res.status(500).json({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }
  
  if (req.method === 'GET') {
    try {
      const { user_id } = req.query;
      
      if (!user_id) {
        return res.status(400).json({ error: "user_id is required" });
      }
      
      if (!supabaseAdmin) {
        return res.status(500).json({ 
          error: "Database connection not configured",
          details: "Supabase environment variables not set"
        });
      }
      
      const { data, error } = await supabaseAdmin
        .from('chat_threads')
        .select('*')
        .eq('user_id', user_id)
        .eq('archived', false)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching threads:', error);
        return res.status(500).json({ error: "Failed to fetch threads" });
      }
      
      return res.json(data || []);
    } catch (error) {
      console.error("Get threads endpoint error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  
  return res.status(405).json({ error: "Method not allowed" });
}