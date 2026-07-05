/**
 * AgentMetadata — optional metadata interface for product-aware routing.
 * Agents that participate in the multi-product orchestration declare their
 * supported products, cross-cutting event subscriptions, and execution priority.
 *
 * Requirements: 8.3, 3.7, 4.7, 5.6
 */
export interface AgentMetadata {
  /** Unique agent identifier matching the AgentId type union */
  agentId: string;

  /** Human-readable display name for UI and logging */
  displayName: string;

  /** Product types this agent participates in (e.g., 'personal_loan', 'savings_account') */
  supportedProducts: string[];

  /** Cross-cutting events this agent listens to (e.g., 'trigger_onboarding', 'language_detected') */
  eventSubscriptions: string[];

  /** Execution priority — lower values execute earlier in the pipeline */
  priority: number;
}
