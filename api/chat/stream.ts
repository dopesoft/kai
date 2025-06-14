import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
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

// Helper to generate embeddings
async function generateEmbedding(text: string, apiKey?: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

// Extract memories from conversation
async function extractMemories(userMessage: string, assistantMessage: string, apiKey?: string) {
  console.log('🧠 Extracting memories from conversation...');
  
  const openai = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  
  const extractionPrompt = `Analyze this conversation and extract memorable information using STRICT categorization criteria.

User: ${userMessage}
Assistant: ${assistantMessage}

## CRITICAL RULES:
1. LONG-TERM MEMORY = Important facts about the person that will be useful in future conversations (doesn't need to be permanent forever)
2. SHORT-TERM MEMORY = Temporary, session-specific context that is only relevant to this conversation thread
3. Focus on capturing meaningful personal information, professional details, and important life context

## LONG-TERM MEMORY Categories:

### Personal
- **identity**: Full name, nicknames, pronouns, age, birthday
- **location**: Current city, country, timezone, where they live or work
- **background**: Birthplace, nationality, languages, cultural background, education
- **physical**: Health conditions, disabilities, allergies, dietary restrictions
- **personality**: Traits, values, communication preferences

### Professional
- **career**: Current job title, company, industry, role, responsibilities
- **expertise**: Skills, certifications, education, specializations, experience level
- **history**: Past jobs, career changes, major projects, achievements, awards
- **goals**: Career aspirations, professional development, business interests

### Relationships
- **family**: Spouse/partner, children, parents, siblings, extended family (with names/details)
- **social**: Close friends, important relationships, social context
- **professional**: Colleagues, mentors, business partners, clients (if mentioned)
- **pets**: Pet names, types, care details

### Preferences & Interests
- **interests**: Hobbies, passions, entertainment, sports, activities
- **lifestyle**: Living situation, routines, habits, travel, lifestyle choices
- **technology**: Devices, platforms, tools they use, tech comfort level
- **learning**: Areas of interest, learning goals, educational pursuits

### Events & Context
- **recurring**: Birthdays, anniversaries, regular commitments
- **upcoming**: Important events, deadlines, planned activities
- **historical**: Past achievements, significant life events, milestones
- **constraints**: Time zones, availability, financial context, limitations

## SHORT-TERM MEMORY Categories (TEMPORARY CONTEXT):

### Conversation Context
- Current topic being discussed
- Questions asked in this session
- Temporary goals or concerns (like "trying to be more organized")
- Current problems they're working on
- This session's mood or feelings

### Task Context
- Current projects being discussed
- Immediate next steps
- Session-specific preferences
- Tools or methods they want to try

## EXAMPLES:
✅ "My name is John" → LONG-TERM: personal/identity
✅ "I'm 35 years old" → LONG-TERM: personal/identity  
✅ "I work at Google as a software engineer" → LONG-TERM: professional/career
✅ "I live in San Francisco" → LONG-TERM: personal/location
✅ "My wife's name is Sarah" → LONG-TERM: relationships/family
✅ "My wife is a doctor" → LONG-TERM: relationships/family
✅ "I have a Masters in Computer Science" → LONG-TERM: professional/expertise
✅ "I won the Employee of the Year award in 2023" → LONG-TERM: professional/history
✅ "I love playing guitar" → LONG-TERM: preferences/interests
✅ "I have two cats named Milo and Luna" → LONG-TERM: relationships/pets
❌ "I'm trying to find ways to be more organized" → SHORT-TERM (current goal/task)
❌ "I'm feeling stressed today" → SHORT-TERM (temporary emotional state)
❌ "For this project, I want a formal tone" → SHORT-TERM (session preference)
❌ "I'm currently working on a presentation" → SHORT-TERM (active task)

Return JSON with this exact structure:
{
  "short_term": [
    {
      "display": "Natural language description",
      "tags": ["conversation", "current_goal", "mood", etc.]
    }
  ],
  "long_term": [
    {
      "category": "personal|professional|relationships|preferences|events|context",
      "key": "snake_case_identifier", 
      "value": "actual_value",
      "display": "Natural language description",
      "importance": 1-5
    }
  ]
}

Capture meaningful facts about the person that would be useful to remember in future conversations.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Extract memories from the conversation following the JSON format specified." },
        { role: "user", content: extractionPrompt }
      ],
      temperature: 0.7,
      max_completion_tokens: 1000
    });

    // Extract the assistant's response
    let content = '{"short_term":[],"long_term":[]}';
    if (response.choices && response.choices[0]?.message?.content) {
      content = response.choices[0].message.content;
    }
    
    console.log('📝 Raw extraction response:', content);
    
    // Try to clean the response if it has markdown code blocks
    let cleanedContent = content;
    if (content.includes('```json')) {
      cleanedContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    }
    
    try {
      const extracted = JSON.parse(cleanedContent);
      console.log('📝 Parsed memories:', extracted);
      return extracted;
    } catch (parseError) {
      console.error('❌ Failed to parse memory extraction response:', parseError);
      console.error('Raw content was:', content);
      return { short_term: [], long_term: [] };
    }
  } catch (error) {
    console.error('❌ Memory extraction error:', error);
    return { short_term: [], long_term: [] };
  }
}

// Fetch relevant memories
async function fetchMemories(userId: string, threadId: string, userMessage: string, apiKey?: string) {
  if (!supabaseAdmin) return { shortTermMemories: [], longTermMemories: [] };
  
  console.log('🔍 Fetching memories for:', { userId, threadId });
  
  // 1. Get recent short-term memories for this thread
  const { data: shortTermMemories, error: shortError } = await supabaseAdmin
    .from('short_term_memory')
    .select('*')
    .eq('user_id', userId)
    .eq('thread_id', threadId)
    .order('timestamp', { ascending: false })
    .limit(10);

  if (shortError) {
    console.error('❌ Short-term memory fetch error:', shortError);
  }

  // 2. Get relevant long-term memories using semantic search
  let longTermMemories = [];
  try {
    const messageEmbedding = await generateEmbedding(userMessage, apiKey);
    
    const { data, error: longError } = await supabaseAdmin.rpc('match_memories', {
      query_embedding: messageEmbedding,
      match_threshold: 0.7,
      match_count: 5,
      user_id: userId
    });
    
    if (longError) {
      console.error('❌ Long-term memory fetch error:', longError);
    } else {
      longTermMemories = data || [];
    }
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
  }

  return {
    shortTermMemories: shortTermMemories || [],
    longTermMemories: longTermMemories || []
  };
}

// Process memories for context
function processMemoriesForContext(memories: any) {
  const { shortTermMemories, longTermMemories } = memories;
  
  let contextParts = [];
  
  if (shortTermMemories.length > 0) {
    const shortTermContext = shortTermMemories
      .map((m: any) => `[${new Date(m.timestamp).toLocaleString()}] ${m.sender}: ${m.message}`)
      .join('\n');
    contextParts.push(`Recent conversation history:\n${shortTermContext}`);
  }
  
  if (longTermMemories.length > 0) {
    const longTermContext = longTermMemories
      .map((m: any) => `- ${m.display_text || m.value}`)
      .join('\n');
    contextParts.push(`Relevant information from memory:\n${longTermContext}`);
  }
  
  return contextParts.length > 0 ? contextParts.join('\n\n') : null;
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, apiKey, model, userId, threadId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Initialize OpenAI with provided API key or default
    const openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY || 'demo_key'
    });

    // Fetch memories if we have user and thread info
    let memoryContext = null;
    if (userId && threadId && supabaseAdmin) {
      const memories = await fetchMemories(userId, threadId, message, apiKey);
      memoryContext = processMemoriesForContext(memories);
    }

    // Build messages array
    const messages: any[] = [];
    
    // Add memory context as system message if available
    if (memoryContext) {
      messages.push({
        role: 'system',
        content: `You are Kai, a helpful AI assistant. Here is some context from our previous conversations:\n\n${memoryContext}\n\nUse this context to provide more personalized and relevant responses.`
      });
    } else {
      messages.push({
        role: 'system',
        content: 'You are Kai, a helpful AI assistant. Be helpful, harmless, and honest.'
      });
    }
    
    // Add user message
    messages.push({ role: 'user', content: message });

    // Use chat completions API with streaming
    const activeModel = model || 'gpt-4';
    const isReasoningModel = /^(o[1-9]|gpt-4\.1)/i.test(activeModel);
    
    console.log(`🔍 Model: ${activeModel}, isReasoningModel: ${isReasoningModel}`);
    
    // Use messages parameter for chat completions API
    const requestParams: any = {
      model: activeModel,
      messages: messages,
      max_completion_tokens: 2000,
      stream: true
    };

    // Only add temperature and top_p for non-reasoning models
    if (!isReasoningModel) {
      console.log(`✅ Adding temperature for non-reasoning model: ${activeModel}`);
      requestParams.temperature = 0.7;
      requestParams.top_p = 1;
    } else {
      console.log(`🚫 Skipping temperature for reasoning model: ${activeModel}`);
    }
    
    const stream = await openai.chat.completions.create(requestParams);
    
    // Stream the response
    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    
    console.log(`📝 Streamed response complete. Length: ${fullResponse.length}`);

    // Save the conversation to database if we have the necessary info
    if (userId && threadId && supabaseAdmin) {
      // Save user message
      await supabaseAdmin
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          role: 'user',
          content: message,
          metadata: { user_id: userId }
        });

      // Save assistant response
      console.log('💾 Attempting to save assistant message to chat_messages...', {
        thread_id: threadId,
        role: 'assistant',
        content_length: fullResponse.length,
        model: activeModel,
        user_id: userId
      });
      
      const { data: assistantData, error: assistantError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          role: 'assistant',
          content: fullResponse,
          metadata: { user_id: userId, model: activeModel }
        })
        .select();
        
      if (assistantError) {
        console.error('❌ Failed to save assistant message to chat_messages:', {
          error: assistantError.message,
          code: assistantError.code,
          details: assistantError.details,
          hint: assistantError.hint
        });
      } else {
        console.log('✅ Assistant message saved to chat_messages:', assistantData);
      }

      // Extract and save memories using AI analysis
      console.log('🎯 Attempting to extract and save memories...');
      const extractedMemories = await extractMemories(message, fullResponse, apiKey);
      
      // Log what was extracted
      console.log('📊 Extracted memories:', {
        shortTermCount: extractedMemories.short_term?.length || 0,
        longTermCount: extractedMemories.long_term?.length || 0,
        shortTermMemories: extractedMemories.short_term,
        longTermMemories: extractedMemories.long_term
      });

      // Save short-term memories
      if (extractedMemories.short_term && extractedMemories.short_term.length > 0) {
        console.log(`💾 Saving ${extractedMemories.short_term.length} short-term memories...`);
        for (const memory of extractedMemories.short_term) {
          const { error } = await supabaseAdmin.from('short_term_memory').insert({
            user_id: userId,
            thread_id: threadId,
            message: memory.display,
            display_text: memory.display,
            sender: 'system',
            tags: memory.tags || ['auto-captured'],
            metadata: { auto_captured: true }
          });
          if (error) {
            console.error('❌ Short-term memory save error:', error);
          }
        }
      }

      // Save long-term memories with embeddings
      if (extractedMemories.long_term && extractedMemories.long_term.length > 0) {
        console.log(`💾 Saving ${extractedMemories.long_term.length} long-term memories...`);
        for (const memory of extractedMemories.long_term) {
          const embedding = await generateEmbedding(memory.value, apiKey);
          
          const { error } = await supabaseAdmin.from('long_term_memory').insert({
            user_id: userId,
            category: memory.category,
            key: memory.key,
            value: memory.value,
            display_text: memory.display,
            importance: memory.importance || 3,
            embedding: embedding,
            metadata: { 
              auto_captured: true,
              subcategory: memory.key.split('_')[0],
              extracted_from: 'conversation'
            }
          });
          if (error) {
            console.error('❌ Long-term memory save error:', error);
          } else {
            console.log('✅ Long-term memory saved:', { 
              category: memory.category, 
              key: memory.key, 
              value: memory.value,
              importance: memory.importance 
            });
          }
        }
      }

      // Send memory update notification with actual extracted memories
      res.write(`data: ${JSON.stringify({ 
        type: 'memory_update',
        memories: extractedMemories
      })}\n\n`);
    }

    // Send done signal
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error: any) {
    console.error('Stream error:', error);
    
    // If headers haven't been sent yet, send error as JSON
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    } else {
      // If streaming has started, send error in stream
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}