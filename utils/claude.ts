import Anthropic from '@anthropic-ai/sdk';
import { EXPO_PUBLIC_CLAUDE_API_KEY } from '@env';

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: EXPO_PUBLIC_CLAUDE_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function getChatCompletion(
  messages: ChatMessage[],
  options: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  } = {}
) {
  try {
    const {
      maxTokens = 1000,
      temperature = 0.7,
      model = 'claude-3-haiku-20240307'
    } = options;

    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // Check if response has content and it's a text block
    const messageContent = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    return {
      success: true,
      message: messageContent,
      usage: response.usage,
    };
  } catch (error) {
    console.error('Error in getChatCompletion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Helper function to create a simple chat message
export function createChatMessage(role: 'user' | 'assistant', content: string): ChatMessage {
  return { role, content };
}

// Example usage:
// const messages = [
//   createChatMessage('user', 'What is the capital of France?'),
// ];
// const response = await getChatCompletion(messages); 