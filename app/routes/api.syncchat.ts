
import { json } from '@remix-run/cloudflare';
import type { Message } from 'ai';
import { ChatStorage } from '~/lib/storage';
import { UserSessionStorage } from '~/lib/storage/userSessions';

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { messages, chatId, walletAddress } = await request.json();
    
    if (!messages || !chatId || !walletAddress) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const chatStorage = new ChatStorage(context.env.CHAT_HISTORY, context.env.DB);
    const userStorage = new UserSessionStorage(context.env.CHAT_HISTORY, context.env.DB);
    
    // Save chat content
    await chatStorage.saveChat(chatId, JSON.stringify(messages));
    
    // Associate chat with user
    await userStorage.addChatToUserSession(walletAddress, chatId);
    
    return json({ success: true });
  } catch (error) {
    console.error('Error syncing chat:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
