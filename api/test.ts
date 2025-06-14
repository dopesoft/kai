import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Test API called:', {
    method: req.method,
    url: req.url,
    query: req.query,
    timestamp: new Date().toISOString()
  });
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.json({
    success: true,
    message: 'Test API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    query: req.query,
    environment: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasViteSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
}