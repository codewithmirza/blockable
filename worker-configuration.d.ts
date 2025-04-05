interface Env {
  ANTHROPIC_API_KEY: string;
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  AI: any;
  
  // Agent Durable Object binding
  AGENT_STATE: DurableObjectNamespace;
}
