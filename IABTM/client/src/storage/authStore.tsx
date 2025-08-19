import { create } from "zustand";
import { User } from "@/types/userType";

interface AuthState {
  // State
  redirectionStep: number | null;
  personalDetails: {
    userName: string | null;
    userEmail: string | null;
    profileName: string | null;
    phoneNumber: string | null;
    password: string | null;
    profilePicture: string | null;
  };
  attributes: {
    currentSelf: string[];
    imagineSelf: string[];
    learningStyle: string[];
    mediaPreferences: string[];
  };
  user: User | null;
  loading?: boolean;

  mediaStatuses: Record<string, boolean>;

  // Actions
  setRedirectionStep: (redirectionStep: number) => void;
  clearRedirectionStep: () => void;
  clearOnboarding: () => void;
  setUserName: (userName: string | null) => void;
  setUserEmail: (userEmail: string | null) => void;
  setProfileName: (profileName: string | null) => void;
  setPhoneNumber: (phoneNumber: string | null) => void;
  setPassword: (password: string | null) => void;
  setProfilePicture: (profilePicture: string | null) => void;
  setCurrentSelf: (currentSelf: string[]) => void;
  setImagineSelf: (imagineSelf: string[]) => void;
  setLearningStyle: (learningStyle: string[]) => void;
  setMediaPreferences: (mediaPreferences: string[]) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;

  setMediaStatuses: (mediaStatuses: Record<string, boolean>) => void;

  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  // Initial State
  redirectionStep: null,
  personalDetails: {
    userName: null,
    userEmail: null,
    profileName: null,
    phoneNumber: null,
    password: null,
    profilePicture: null,
  },
  attributes: {
    currentSelf: [],
    imagineSelf: [],
    learningStyle: [],
    mediaPreferences: [],
  },
  user: null,
  loading: true,

  mediaStatuses: {},

  // Actions
  setRedirectionStep: (redirectionStep) => set({ redirectionStep }),
  clearRedirectionStep: () => set({ redirectionStep: null }),

  clearOnboarding: () =>
    set(() => ({
      redirectionStep: null,
      personalDetails: {
        userName: null,
        userEmail: null,
        profileName: null,
        phoneNumber: null,
        password: null,
        profilePicture: null,
      },
      attributes: {
        currentSelf: [],
        imagineSelf: [],
        learningStyle: [],
        mediaPreferences: [],
      },
    })),

  setUserName: (userName) =>
    set((state) => ({
      personalDetails: { ...state.personalDetails, userName },
    })),
  setUserEmail: (userEmail) =>
    set((state) => ({
      personalDetails: { ...state.personalDetails, userEmail },
    })),
  setProfileName: (profileName) =>
    set((state) => ({
      personalDetails: { ...state.personalDetails, profileName },
    })),
  setPhoneNumber: (phoneNumber) =>
    set((state) => ({
      personalDetails: { ...state.personalDetails, phoneNumber },
    })),
  setPassword: (password) =>
    set((state) => ({
      personalDetails: { ...state.personalDetails, password },
    })),
  setProfilePicture: (profilePicture) =>
    set((state) => ({
      personalDetails: { ...state.personalDetails, profilePicture },
    })),
  setCurrentSelf: (currentSelf) =>
    set((state) => ({
      attributes: { ...state.attributes, currentSelf },
    })),
  setImagineSelf: (imagineSelf) =>
    set((state) => ({
      attributes: { ...state.attributes, imagineSelf },
    })),
  setLearningStyle: (learningStyle) =>
    set((state) => ({
      attributes: { ...state.attributes, learningStyle },
    })),
  setMediaPreferences: (mediaPreferences) =>
    set((state) => ({
      attributes: { ...state.attributes, mediaPreferences },
    })),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  setMediaStatuses: (mediaStatuses) => set({ mediaStatuses }),

  logout: () => set((state) => ({
    user: null,
    loading: false,
    redirectionStep: null,
    personalDetails: {
      userName: null,
      userEmail: null,
      profileName: null,
      phoneNumber: null,
      password: null,
      profilePicture: null,
    },
    attributes: {
      currentSelf: [],
      imagineSelf: [],
      learningStyle: [],
      mediaPreferences: [],
    },
    mediaStatuses: {},
  })),
}));