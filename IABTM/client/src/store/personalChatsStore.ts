import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PersonalChat {
  id: string;
  name: string;
  type: 'personal';
  profilePicture?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  isOnline?: boolean;
  isMicEnabled: boolean;
}

interface PersonalChatsState {
  personalChats: PersonalChat[];
  selectedChat: PersonalChat | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setPersonalChats: (chats: PersonalChat[]) => void;
  addPersonalChat: (chat: PersonalChat) => void;
  updatePersonalChat: (chatId: string, updates: Partial<PersonalChat>) => void;
  removePersonalChat: (chatId: string) => void;
  selectChat: (chat: PersonalChat | null) => void;
  ensureChatInList: (chat: PersonalChat) => void;
  moveChatToTop: (chatId: string, lastMessage: string, lastMessageTime: Date) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const usePersonalChatsStore = create<PersonalChatsState>()(
  persist(
    (set, get) => ({
      personalChats: [],
      selectedChat: null,
      loading: false,
      error: null,

      setPersonalChats: (chats) => set({ personalChats: chats }),

      addPersonalChat: (chat) => set((state) => {
        const personalChats = Array.isArray(state.personalChats) ? state.personalChats : [];
        const chatExists = personalChats.some(c => c.id === chat.id);
        if (!chatExists) {
          console.log('➕ Adding personal chat to global store:', chat.name);
          return { personalChats: [chat, ...personalChats] };
        }
        return state;
      }),

      updatePersonalChat: (chatId, updates) => set((state) => {
        const personalChats = Array.isArray(state.personalChats) ? state.personalChats : [];
        return {
          personalChats: personalChats.map(chat =>
            chat.id === chatId ? { ...chat, ...updates } : chat
          )
        };
      }),

      removePersonalChat: (chatId) => set((state) => {
        const personalChats = Array.isArray(state.personalChats) ? state.personalChats : [];
        return {
          personalChats: personalChats.filter(chat => chat.id !== chatId)
        };
      }),

      selectChat: (chat) => set({ selectedChat: chat }),

      ensureChatInList: (chat) => {
        const state = get();
        const personalChats = Array.isArray(state.personalChats) ? state.personalChats : [];
        const chatExists = personalChats.some(c => c.id === chat.id);
        if (!chatExists) {
          console.log('➕ Ensuring personal chat in global store:', chat.name);
          const newChatEntry: PersonalChat = {
            id: chat.id,
            name: chat.name,
            type: 'personal',
            profilePicture: chat.profilePicture,
            lastMessage: chat.lastMessage || '',
            lastMessageTime: chat.lastMessageTime || new Date(),
            unreadCount: chat.unreadCount || 0,
            isOnline: chat.isOnline || false,
            isMicEnabled: false
          };
          set((state) => ({ personalChats: [newChatEntry, ...personalChats] }));
        }
      },

      moveChatToTop: (chatId, lastMessage, lastMessageTime) => set((state) => {
        const personalChats = Array.isArray(state.personalChats) ? state.personalChats : [];
        const updatedChats = personalChats.map(chat =>
          chat.id === chatId
            ? { ...chat, lastMessage, lastMessageTime, unreadCount: (chat.unreadCount || 0) + 1 }
            : chat
        );
        
        // Sort by activity (most recent first)
        const sortedChats = [...updatedChats].sort((a, b) => {
          // First, sort by unread count (unread chats first)
          if ((a.unreadCount || 0) > 0 && (b.unreadCount || 0) === 0) return -1;
          if ((a.unreadCount || 0) === 0 && (b.unreadCount || 0) > 0) return 1;
          
          // Then sort by last message timestamp (most recent first)
          const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          
          return bTime - aTime;
        });
        
        return { personalChats: sortedChats };
      }),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'personal-chats-storage', // unique name for localStorage
      partialize: (state) => ({ 
        personalChats: state.personalChats,
        selectedChat: state.selectedChat 
      }), // only persist these fields
    }
  )
); 