import { supabase } from './supabase';

export interface Integration {
  id?: string;
  user_id: string;
  type: 'AI' | 'CALENDAR' | 'MAIL';
  provider: string;
  api_key?: string;
  access_token?: string;
  refresh_token?: string;
  config?: Record<string, any>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const integrationService = {
  // Fetch all active integrations for a user
  async getIntegrations(userId: string): Promise<Integration[]> {
    try {
      const response = await fetch(`/api/integrations?user_id=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch integrations');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching integrations:', error);
      return [];
    }
  },

  // Create a new integration
  async createIntegration(integration: Omit<Integration, 'id' | 'created_at' | 'updated_at'>): Promise<Integration | null> {
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(integration),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create integration');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating integration:', error);
      throw error;
    }
  },

  // Update an existing integration
  async updateIntegration(id: string, userId: string, updates: Partial<Integration>): Promise<Integration | null> {
    try {
      const response = await fetch('/api/integrations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          user_id: userId,
          ...updates,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update integration');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating integration:', error);
      throw error;
    }
  },

  // Delete an integration
  async deleteIntegration(id: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/integrations?id=${id}&user_id=${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete integration');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting integration:', error);
      return false;
    }
  },

  // Migrate localStorage integrations to database (one-time migration)
  async migrateFromLocalStorage(userId: string): Promise<void> {
    try {
      // Check if already migrated - temporarily disabled to force re-migration
      const migrated = localStorage.getItem('integrations_migrated_v2');
      if (migrated === 'true') {
        return;
      }

      // Get existing integrations from localStorage
      const openaiKey = localStorage.getItem('chatgpt_api_key');
      const openaiModel = localStorage.getItem('chatgpt_model');
      const claudeKey = localStorage.getItem('claude_api_key');
      const claudeModel = localStorage.getItem('claude_model');
      const geminiKey = localStorage.getItem('gemini_api_key');
      const geminiModel = localStorage.getItem('gemini_model');
      
      const verifiedIntegrations = JSON.parse(localStorage.getItem('verified_integrations') || '[]');

      // Migrate each integration
      const migrations = [];

      if (openaiKey) {
        migrations.push(
          this.createIntegration({
            user_id: userId,
            type: 'AI',
            provider: 'openai',
            api_key: openaiKey,
            config: { model: openaiModel || 'o4-mini' },
            is_active: true,
          })
        );
      }

      if (claudeKey) {
        migrations.push(
          this.createIntegration({
            user_id: userId,
            type: 'AI',
            provider: 'claude',
            api_key: claudeKey,
            config: { model: claudeModel || 'claude-3-5-sonnet-20241022' },
            is_active: true,
          })
        );
      }

      if (geminiKey) {
        migrations.push(
          this.createIntegration({
            user_id: userId,
            type: 'AI',
            provider: 'gemini',
            api_key: geminiKey,
            config: { model: geminiModel || 'gemini-1.5-pro' },
            is_active: true,
          })
        );
      }

      // Wait for all migrations to complete
      await Promise.all(migrations);

      // Mark as migrated
      localStorage.setItem('integrations_migrated_v2', 'true');
      
      // Clean up localStorage (optional - keep for fallback)
      // localStorage.removeItem('chatgpt_api_key');
      // localStorage.removeItem('claude_api_key');
      // localStorage.removeItem('gemini_api_key');
      
    } catch (error) {
      console.error('Error migrating integrations:', error);
    }
  },

  // Get integration config by provider (helper for chat)
  async getIntegrationByProvider(userId: string, provider: string): Promise<Integration | null> {
    try {
      const integrations = await this.getIntegrations(userId);
      return integrations.find(i => i.provider === provider && i.is_active) || null;
    } catch (error) {
      console.error('Error getting integration by provider:', error);
      return null;
    }
  }
};