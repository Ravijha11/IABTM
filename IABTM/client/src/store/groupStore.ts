import { create } from 'zustand';

interface Group {
  _id: string;
  name: string;
  description?: string;
  members: any[];
  admins: any[];
  creator: any;
}

interface Message {
  _id: string;
  sender: any;
  content: string;
  createdAt: string;
  // Add cursor for pagination
  cursor?: string;
}

interface GroupState {
  groups: Group[];
  selectedGroup: Group | null;
  messages: Message[];
  // Add pagination state
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
  lastCursor: string | null;
  loading: boolean;
  error: string | null;
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  selectGroup: (group: Group) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  // Add pagination methods
  loadMoreMessages: (cursor?: string) => Promise<void>;
  prependMessages: (messages: Message[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  selectedGroup: null,
  messages: [],
  hasMoreMessages: true,
  isLoadingMessages: false,
  lastCursor: null,
  loading: false,
  error: null,
  setGroups: (groups) => set({ groups }),
  addGroup: (group) => set((state) => ({ groups: [group, ...state.groups] })),
  selectGroup: (group) => set({ selectedGroup: group, messages: [], lastCursor: null, hasMoreMessages: true }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message],
    // Update cursor for new messages
    lastCursor: message.cursor || message._id
  })),
  // Enhanced pagination method
  loadMoreMessages: async (cursor) => {
    const state = get();
    if (!state.selectedGroup || state.isLoadingMessages) return;
    
    set({ isLoadingMessages: true });
    try {
      const response = await fetch(`/api/messages?groupId=${state.selectedGroup._id}&cursor=${cursor || state.lastCursor}&limit=50`);
      const data = await response.json();
      
      if (data.success) {
        const newMessages = data.data;
        set((state) => ({
          messages: [...newMessages, ...state.messages], // Prepend older messages
          hasMoreMessages: newMessages.length === 50,
          lastCursor: newMessages[newMessages.length - 1]?._id || state.lastCursor,
          isLoadingMessages: false
        }));
      }
    } catch (error) {
      set({ error: 'Failed to load messages', isLoadingMessages: false });
    }
  },
  prependMessages: (messages) => set((state) => ({
    messages: [...messages, ...state.messages]
  })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
})); 