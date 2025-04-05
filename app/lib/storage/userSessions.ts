
import { Storage } from '@cloudflare/workers-types';

export interface UserSession {
  walletAddress: string;
  lastActive: string;
  chatIds: string[];
}

export class UserSessionStorage {
  constructor(
    private kv: Storage,
    private db: D1Database
  ) {}

  async createOrUpdateSession(walletAddress: string): Promise<void> {
    const timestamp = new Date().toISOString();
    
    // Store in KV for quick access
    await this.kv.put(`user:${walletAddress}`, JSON.stringify({
      walletAddress,
      lastActive: timestamp,
      chatIds: []
    }));
    
    // Persist in D1 for durability
    await this.db.prepare(
      'INSERT INTO users (wallet_address, last_active) VALUES (?, ?) ' +
      'ON CONFLICT (wallet_address) DO UPDATE SET last_active = excluded.last_active'
    ).bind(walletAddress, timestamp).run();
  }

  async addChatToUserSession(walletAddress: string, chatId: string): Promise<void> {
    // First get existing session
    const sessionData = await this.kv.get(`user:${walletAddress}`);
    if (sessionData) {
      const session: UserSession = JSON.parse(sessionData);
      if (!session.chatIds.includes(chatId)) {
        session.chatIds.push(chatId);
        await this.kv.put(`user:${walletAddress}`, JSON.stringify(session));
      }
    }
    
    // Associate chat with user in D1
    await this.db.prepare(
      'INSERT INTO user_chats (wallet_address, chat_id) VALUES (?, ?)'
    ).bind(walletAddress, chatId).run();
  }

  async getUserChats(walletAddress: string): Promise<string[]> {
    // Try KV first for speed
    const sessionData = await this.kv.get(`user:${walletAddress}`);
    if (sessionData) {
      const session: UserSession = JSON.parse(sessionData);
      return session.chatIds;
    }
    
    // Fall back to D1
    const { results } = await this.db.prepare(
      'SELECT chat_id FROM user_chats WHERE wallet_address = ?'
    ).bind(walletAddress).all();
    
    return results.map(r => r.chat_id as string);
  }
}
