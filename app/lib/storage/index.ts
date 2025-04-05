
import { Storage } from '@cloudflare/workers-types';

export class ChatStorage {
  constructor(
    private kv: Storage,
    private db: D1Database
  ) {}

  async saveChat(id: string, content: string) {
    await this.kv.put(`chat:${id}`, content);
    await this.db.prepare(
      'INSERT INTO chats (id, content, created_at) VALUES (?, ?, ?)'
    ).bind(id, content, new Date().toISOString()).run();
  }

  async getChat(id: string) {
    return await this.kv.get(`chat:${id}`);
  }
}

export class BlockchainStorage {
  constructor(private db: D1Database) {}

  async saveContract(address: string, chain: string, abi: string) {
    await this.db.prepare(
      'INSERT INTO contracts (address, chain, abi) VALUES (?, ?, ?)'
    ).bind(address, chain, abi).run();
  }
}
