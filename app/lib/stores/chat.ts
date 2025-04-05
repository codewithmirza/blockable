import { map } from 'nanostores';

export const chatStore = map({
  started: false,
  aborted: false,
  showChat: true,
  agentResponding: false
});

// Helper functions to manage agent state
export function setAgentResponding(value: boolean) {
  chatStore.setKey('agentResponding', value);
}

export function isAgentResponding() {
  return chatStore.get().agentResponding;
}
