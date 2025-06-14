# Deployment Guide

## Environment Variables

When deploying to Vercel or other platforms, you need to set the following environment variables:

### Required Variables

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)

### Optional but Recommended

- `ENCRYPTION_KEY` - A 64-character hex string for encrypting API keys in the database
  - Generate with: `openssl rand -hex 32`
  - **IMPORTANT**: Use the same key across all deployments to ensure data can be decrypted
  - If not set, API keys will be stored in plain text (not recommended for production)

- `OPENAI_API_KEY` - Default OpenAI API key (users can override with their own)

### Setting up Encryption Key

1. Generate a secure encryption key:
   ```bash
   openssl rand -hex 32
   ```

2. Add it to your Vercel environment variables:
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Add `ENCRYPTION_KEY` with the generated value

3. **Important**: If you change this key, all existing encrypted data will become unreadable. Users will need to re-enter their API keys.

### Handling Encryption Errors

If you see "Failed to decrypt API key" errors:
1. This means the data was encrypted with a different key
2. Users will need to re-enter their API keys in Settings
3. Make sure the same `ENCRYPTION_KEY` is used across all environments

### Migration from Plain Text

If you previously stored API keys without encryption:
1. Set the `ENCRYPTION_KEY` environment variable
2. The system will automatically handle both encrypted and plain text keys
3. New keys will be encrypted, old keys will continue to work