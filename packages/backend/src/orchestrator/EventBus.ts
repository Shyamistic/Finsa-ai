import Redis from 'ioredis';
import { logger } from '../lib/logger';

export type AgentId =
  | 'visual_intel'
  | 'speech_intel'
  | 'fraud_detection'
  | 'bureau_risk'
  | 'persona'
  | 'offer'
  | 'compliance'
  | 'auto_fill'
  | 'credit_score_simulator'
  // New agents for Finsa AI multi-product platform
  | 'customer_acquisition'
  | 'digital_adoption'
  | 'life_event'
  | 'multilingual';

export type ChannelName = `session:${string}:${AgentId | 'orchestrator' | 'acquisition' | 'adoption' | 'engagement' | 'multilingual'}`;

export class EventBus {
  private publisher: Redis;
  private subscriber: Redis;
  private handlers: Map<string, ((data: unknown) => void)[]> = new Map();

  constructor(redisUrl: string) {
    this.publisher = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);

    this.subscriber.on('message', (channel: string, message: string) => {
      try {
        const data = JSON.parse(message);
        const channelHandlers = this.handlers.get(channel) ?? [];
        channelHandlers.forEach(h => h(data));
      } catch (err) {
        logger.error({ event: 'eventbus_parse_error', channel, err });
      }
    });
  }

  async publish(channel: ChannelName, data: unknown): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(data));
  }

  subscribe(channel: ChannelName, handler: (data: unknown) => void): void {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, []);
      this.subscriber.subscribe(channel);
    }
    this.handlers.get(channel)!.push(handler);
  }

  unsubscribeAll(sessionId: string): void {
    const prefix = `session:${sessionId}:`;
    for (const channel of this.handlers.keys()) {
      if (channel.startsWith(prefix)) {
        this.subscriber.unsubscribe(channel);
        this.handlers.delete(channel);
      }
    }
  }

  async quit(): Promise<void> {
    await this.publisher.quit();
    await this.subscriber.quit();
  }
}
