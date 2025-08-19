// Event types for type safety
export type EventType = 
  | 'message:new'
  | 'message:delivered'
  | 'message:read'
  | 'typing:start'
  | 'typing:stop'
  | 'audio:join'
  | 'audio:leave'
  | 'audio:mute'
  | 'audio:unmute'
  | 'audio:speaking'
  | 'user:online'
  | 'user:offline'
  | 'group:update'
  | 'group:delete'
  | 'notification:new';

// Event payload interface
export interface EventPayload {
  [key: string]: any;
}

// Event handler type
export type EventHandler = (payload: EventPayload) => void;

// Pub/Sub Event Bus
class EventBus {
  private events: Map<EventType, Set<EventHandler>> = new Map();
  private onceEvents: Map<EventType, Set<EventHandler>> = new Map();

  // Subscribe to an event
  subscribe(event: EventType, handler: EventHandler): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    
    this.events.get(event)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.events.get(event)?.delete(handler);
      if (this.events.get(event)?.size === 0) {
        this.events.delete(event);
      }
    };
  }

  // Subscribe to an event once (auto-unsubscribe after first trigger)
  once(event: EventType, handler: EventHandler): () => void {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, new Set());
    }
    
    this.onceEvents.get(event)!.add(handler);
    
    return () => {
      this.onceEvents.get(event)?.delete(handler);
      if (this.onceEvents.get(event)?.size === 0) {
        this.onceEvents.delete(event);
      }
    };
  }

  // Publish an event
  publish(event: EventType, payload: EventPayload): void {
    // Handle regular subscribers
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }

    // Handle once subscribers
    const onceHandlers = this.onceEvents.get(event);
    if (onceHandlers) {
      onceHandlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in once event handler for ${event}:`, error);
        }
      });
      // Clear once handlers after execution
      this.onceEvents.delete(event);
    }
  }

  // Unsubscribe all handlers for an event
  unsubscribeAll(event: EventType): void {
    this.events.delete(event);
    this.onceEvents.delete(event);
  }

  // Get subscriber count for an event
  getSubscriberCount(event: EventType): number {
    const regularCount = this.events.get(event)?.size || 0;
    const onceCount = this.onceEvents.get(event)?.size || 0;
    return regularCount + onceCount;
  }

  // Clear all events
  clear(): void {
    this.events.clear();
    this.onceEvents.clear();
  }
}

// Global event bus instance
export const eventBus = new EventBus();

// Specialized event publishers for chat events
export const chatEvents = {
  // Message events
  publishNewMessage: (message: any) => {
    eventBus.publish('message:new', { message, timestamp: Date.now() });
  },
  
  publishMessageDelivered: (messageId: string, userId: string) => {
    eventBus.publish('message:delivered', { messageId, userId, timestamp: Date.now() });
  },
  
  publishMessageRead: (messageId: string, userId: string) => {
    eventBus.publish('message:read', { messageId, userId, timestamp: Date.now() });
  },

  // Typing events
  publishTypingStart: (userId: string, roomId: string) => {
    eventBus.publish('typing:start', { userId, roomId, timestamp: Date.now() });
  },
  
  publishTypingStop: (userId: string, roomId: string) => {
    eventBus.publish('typing:stop', { userId, roomId, timestamp: Date.now() });
  },

  // Audio room events
  publishAudioJoin: (userId: string, roomId: string) => {
    eventBus.publish('audio:join', { userId, roomId, timestamp: Date.now() });
  },
  
  publishAudioLeave: (userId: string, roomId: string) => {
    eventBus.publish('audio:leave', { userId, roomId, timestamp: Date.now() });
  },
  
  publishAudioMute: (userId: string, roomId: string, isMuted: boolean) => {
    eventBus.publish('audio:mute', { userId, roomId, isMuted, timestamp: Date.now() });
  },
  
  publishAudioSpeaking: (userId: string, roomId: string, isSpeaking: boolean) => {
    eventBus.publish('audio:speaking', { userId, roomId, isSpeaking, timestamp: Date.now() });
  },

  // User events
  publishUserOnline: (userId: string) => {
    eventBus.publish('user:online', { userId, timestamp: Date.now() });
  },
  
  publishUserOffline: (userId: string) => {
    eventBus.publish('user:offline', { userId, timestamp: Date.now() });
  },

  // Group events
  publishGroupUpdate: (groupId: string, updates: any) => {
    eventBus.publish('group:update', { groupId, updates, timestamp: Date.now() });
  },
  
  publishGroupDelete: (groupId: string) => {
    eventBus.publish('group:delete', { groupId, timestamp: Date.now() });
  },

  // Notification events
  publishNotification: (notification: any) => {
    eventBus.publish('notification:new', { notification, timestamp: Date.now() });
  }
};

// Hook for using events in React components
export const useEventBus = () => {
  const subscribe = (event: EventType, handler: EventHandler) => {
    return eventBus.subscribe(event, handler);
  };

  const once = (event: EventType, handler: EventHandler) => {
    return eventBus.once(event, handler);
  };

  const publish = (event: EventType, payload: EventPayload) => {
    eventBus.publish(event, payload);
  };

  return { subscribe, once, publish, eventBus };
}; 