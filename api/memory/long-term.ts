import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

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

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo_key'
});

// Helper to generate embeddings
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

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

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Database connection not configured' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { user_id } = req.query;
        
        if (!user_id) {
          return res.status(400).json({ error: 'user_id is required' });
        }
        
        const { data, error } = await supabaseAdmin
          .from('long_term_memory')
          .select('*')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching long-term memories:', error);
          return res.status(500).json({ error: 'Failed to fetch memories' });
        }
        
        return res.status(200).json(data || []);
      }

      case 'POST': {
        const { user_id, display_text } = req.body;
        
        if (!user_id || !display_text) {
          return res.status(400).json({ error: 'user_id and display_text are required' });
        }
        
        // Generate key/value from display_text
        const key = display_text.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50);
        const value = display_text;
        
        // Generate embedding for the value
        const embedding = await generateEmbedding(value);
        
        const newMemory = {
          user_id,
          category: 'personal',
          key,
          value,
          display_text,
          importance: 3,
          embedding,
          metadata: { auto_captured: false }
        };
        
        const { data, error } = await supabaseAdmin
          .from('long_term_memory')
          .insert(newMemory)
          .select()
          .single();
        
        if (error) {
          console.error('Error creating long-term memory:', error);
          return res.status(500).json({ error: 'Failed to create memory' });
        }
        
        return res.status(200).json(data);
      }

      case 'PUT': {
        const id = req.url?.split('/').pop();
        const { display_text } = req.body;
        
        if (!id || !display_text) {
          return res.status(400).json({ error: 'id and display_text are required' });
        }
        
        const { data, error } = await supabaseAdmin
          .from('long_term_memory')
          .update({ 
            display_text,
            last_updated: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating long-term memory:', error);
          return res.status(500).json({ error: 'Failed to update memory' });
        }
        
        return res.status(200).json(data);
      }

      case 'DELETE': {
        const id = req.url?.split('/').pop();
        
        if (!id) {
          return res.status(400).json({ error: 'id is required' });
        }
        
        const { error } = await supabaseAdmin
          .from('long_term_memory')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error deleting long-term memory:', error);
          return res.status(500).json({ error: 'Failed to delete memory' });
        }
        
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Long-term memory endpoint error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}