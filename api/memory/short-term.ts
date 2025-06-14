import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

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
          .from('short_term_memory')
          .select('*')
          .eq('user_id', user_id)
          .order('timestamp', { ascending: false });
        
        if (error) {
          console.error('Error fetching short-term memories:', error);
          return res.status(500).json({ error: 'Failed to fetch memories' });
        }
        
        // Ensure display_text exists
        const processedData = (data || []).map((memory: any) => ({
          ...memory,
          display_text: memory.display_text || memory.message || ''
        }));
        
        return res.status(200).json(processedData);
      }

      case 'POST': {
        const { user_id, display_text, thread_id } = req.body;
        
        if (!user_id || !display_text) {
          return res.status(400).json({ error: 'user_id and display_text are required' });
        }
        
        const newMemory = {
          user_id,
          thread_id: thread_id || nanoid(),
          message: display_text,
          display_text: display_text,
          sender: 'user',
          tags: ['user-created'],
          timestamp: new Date().toISOString(),
          metadata: { auto_captured: false }
        };
        
        const { data, error } = await supabaseAdmin
          .from('short_term_memory')
          .insert(newMemory)
          .select()
          .single();
        
        if (error) {
          console.error('Error creating short-term memory:', error);
          return res.status(500).json({ 
            error: 'Failed to create memory',
            details: error.message
          });
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
          .from('short_term_memory')
          .update({ 
            message: display_text,
            display_text: display_text
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating short-term memory:', error);
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
          .from('short_term_memory')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error deleting short-term memory:', error);
          return res.status(500).json({ error: 'Failed to delete memory' });
        }
        
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Short-term memory endpoint error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}