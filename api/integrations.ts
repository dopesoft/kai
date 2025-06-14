import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Encryption setup
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

// Log encryption key status (not the key itself)
if (!ENCRYPTION_KEY) {
  console.warn('⚠️ ENCRYPTION_KEY not set - API keys will be stored in plain text');
} else {
  console.log('✅ ENCRYPTION_KEY is configured');
}

function encrypt(text: string): string {
  // If no encryption key, store as plain text with a marker
  if (!ENCRYPTION_KEY) {
    return 'PLAIN:' + text;
  }
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return 'ENC:' + iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption failed:', error);
    // Fallback to plain text
    return 'PLAIN:' + text;
  }
}

function decrypt(text: string): string {
  // Check if it's plain text
  if (text.startsWith('PLAIN:')) {
    return text.substring(6);
  }
  
  // Check if it's encrypted
  if (text.startsWith('ENC:')) {
    text = text.substring(4);
  }
  
  // If no encryption key, return as is
  if (!ENCRYPTION_KEY) {
    console.warn('Cannot decrypt - ENCRYPTION_KEY not set');
    return text;
  }
  
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption failed:', error);
    // Return null to indicate decryption failure
    throw new Error('Failed to decrypt');
  }
}

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
    return res.status(500).json({ 
      error: "Database connection not configured",
      details: "Supabase environment variables not set"
    });
  }

  // GET - Retrieve user's integrations
  if (req.method === 'GET') {
    try {
      const { user_id } = req.query;
      
      if (!user_id || typeof user_id !== 'string') {
        return res.status(400).json({ error: "user_id is required" });
      }
      
      const { data, error } = await supabaseAdmin
        .from('integrations')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching integrations:', error);
        return res.status(500).json({ error: "Failed to fetch integrations" });
      }
      
      // Decrypt API keys before sending
      const decryptedData = data?.map(integration => {
        const decrypted = { ...integration };
        
        // Decrypt sensitive fields
        if (integration.api_key_encrypted) {
          try {
            decrypted.api_key = decrypt(integration.api_key_encrypted);
            delete decrypted.api_key_encrypted;
          } catch (err) {
            console.error('Failed to decrypt API key for integration', integration.id, '- it may have been encrypted with a different key');
            // Don't expose the encrypted value, just mark it as unavailable
            decrypted.api_key = null;
            decrypted.api_key_error = 'Decryption failed - please re-enter API key';
          }
        }
        
        if (integration.access_token_encrypted) {
          try {
            decrypted.access_token = decrypt(integration.access_token_encrypted);
            delete decrypted.access_token_encrypted;
          } catch (err) {
            console.error('Failed to decrypt access token:', err);
            decrypted.access_token = null;
          }
        }
        
        // Remove refresh token from response for security
        delete decrypted.refresh_token_encrypted;
        
        return decrypted;
      });
      
      return res.json(decryptedData || []);
    } catch (error) {
      console.error("Get integrations error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  
  // POST - Create new integration
  if (req.method === 'POST') {
    try {
      const { 
        user_id, 
        type, 
        provider, 
        api_key,
        access_token,
        refresh_token,
        config 
      } = req.body;
      
      if (!user_id || !type || !provider) {
        return res.status(400).json({ 
          error: "user_id, type, and provider are required" 
        });
      }
      
      // Prepare data for insertion
      const integrationData: any = {
        user_id,
        type,
        provider,
        config: config || {},
        is_active: true
      };
      
      // Encrypt sensitive fields
      if (api_key) {
        integrationData.api_key_encrypted = encrypt(api_key);
      }
      
      if (access_token) {
        integrationData.access_token_encrypted = encrypt(access_token);
      }
      
      if (refresh_token) {
        integrationData.refresh_token_encrypted = encrypt(refresh_token);
      }
      
      const { data, error } = await supabaseAdmin
        .from('integrations')
        .insert(integrationData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating integration:', error);
        return res.status(500).json({ 
          error: "Failed to create integration",
          details: error.message 
        });
      }
      
      // Remove encrypted fields from response
      const response = { ...data };
      delete response.api_key_encrypted;
      delete response.access_token_encrypted;
      delete response.refresh_token_encrypted;
      
      return res.json(response);
    } catch (error) {
      console.error("Create integration error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  
  // PUT - Update existing integration
  if (req.method === 'PUT') {
    try {
      const { 
        id,
        user_id,
        api_key,
        access_token,
        refresh_token,
        config,
        is_active 
      } = req.body;
      
      if (!id || !user_id) {
        return res.status(400).json({ 
          error: "id and user_id are required" 
        });
      }
      
      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (typeof is_active === 'boolean') {
        updateData.is_active = is_active;
      }
      
      if (config) {
        updateData.config = config;
      }
      
      // Encrypt sensitive fields if provided
      if (api_key) {
        updateData.api_key_encrypted = encrypt(api_key);
      }
      
      if (access_token) {
        updateData.access_token_encrypted = encrypt(access_token);
      }
      
      if (refresh_token) {
        updateData.refresh_token_encrypted = encrypt(refresh_token);
      }
      
      const { data, error } = await supabaseAdmin
        .from('integrations')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user_id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating integration:', error);
        return res.status(500).json({ 
          error: "Failed to update integration",
          details: error.message 
        });
      }
      
      // Remove encrypted fields from response
      const response = { ...data };
      delete response.api_key_encrypted;
      delete response.access_token_encrypted;
      delete response.refresh_token_encrypted;
      
      return res.json(response);
    } catch (error) {
      console.error("Update integration error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  
  // DELETE - Remove integration
  if (req.method === 'DELETE') {
    try {
      const { id, user_id } = req.query;
      
      if (!id || !user_id || typeof id !== 'string' || typeof user_id !== 'string') {
        return res.status(400).json({ 
          error: "id and user_id are required" 
        });
      }
      
      const { error } = await supabaseAdmin
        .from('integrations')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id);
      
      if (error) {
        console.error('Error deleting integration:', error);
        return res.status(500).json({ 
          error: "Failed to delete integration",
          details: error.message 
        });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Delete integration error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  
  return res.status(405).json({ error: "Method not allowed" });
}