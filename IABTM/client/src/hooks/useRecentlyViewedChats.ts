import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/storage/authStore';

interface ChatEntry {
  id: string;
  type: 'personal' | 'group';
  name: string;
  lastViewed: Date;
  unreadCount: number;
  lastMessage?: string;
  profilePicture?: string;
}

class LRUCache {
  private capacity: number;
  private cache: Map<string, ChatEntry>;

  constructor(capacity: number = 20) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: string): ChatEntry | undefined {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      if (value) {
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
      }
    }
    return undefined;
  }

  put(key: string, value: ChatEntry): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  getAll(): ChatEntry[] {
    return Array.from(this.cache.values()).sort((a, b) => 
      new Date(b.lastViewed).getTime() - new Date(a.lastViewed).getTime()
    );
  }

  remove(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const useRecentlyViewedChats = () => {
  const { user } = useAuthStore();
  const [recentChats, setRecentChats] = useState<ChatEntry[]>([]);
  const [cache] = useState(() => new LRUCache(20));

  // Load from localStorage on mount
  useEffect(() => {
    if (!user) return;

    const saved = localStorage.getItem(`recentChats_${user._id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.forEach((entry: any) => {
          cache.put(entry.id, {
            ...entry,
            lastViewed: new Date(entry.lastViewed)
          });
        });
        setRecentChats(cache.getAll());
      } catch (error) {
        console.error('Error loading recent chats:', error);
      }
    }
  }, [user, cache]);

  // Save to localStorage when cache changes
  const saveToStorage = useCallback(() => {
    if (!user) return;
    
    const data = cache.getAll();
    localStorage.setItem(`recentChats_${user._id}`, JSON.stringify(data));
  }, [user, cache]);

  // Add or update a chat in recent list
  const addRecentChat = useCallback((chat: Omit<ChatEntry, 'lastViewed'>) => {
    const entry: ChatEntry = {
      ...chat,
      lastViewed: new Date()
    };
    
    cache.put(chat.id, entry);
    setRecentChats(cache.getAll());
    saveToStorage();
  }, [cache, saveToStorage]);

  // Remove a chat from recent list
  const removeRecentChat = useCallback((chatId: string) => {
    cache.remove(chatId);
    setRecentChats(cache.getAll());
    saveToStorage();
  }, [cache, saveToStorage]);

  // Update unread count for a chat
  const updateUnreadCount = useCallback((chatId: string, unreadCount: number) => {
    const existing = cache.get(chatId);
    if (existing) {
      cache.put(chatId, { ...existing, unreadCount });
      setRecentChats(cache.getAll());
      saveToStorage();
    }
  }, [cache, saveToStorage]);

  // Update last message for a chat
  const updateLastMessage = useCallback((chatId: string, lastMessage: string) => {
    const existing = cache.get(chatId);
    if (existing) {
      cache.put(chatId, { ...existing, lastMessage });
      setRecentChats(cache.getAll());
      saveToStorage();
    }
  }, [cache, saveToStorage]);

  // Clear all recent chats
  const clearRecentChats = useCallback(() => {
    cache.clear();
    setRecentChats([]);
    if (user) {
      localStorage.removeItem(`recentChats_${user._id}`);
    }
  }, [cache, user]);

  return {
    recentChats,
    addRecentChat,
    removeRecentChat,
    updateUnreadCount,
    updateLastMessage,
    clearRecentChats,
    getRecentChat: (chatId: string) => cache.get(chatId)
  };
}; 