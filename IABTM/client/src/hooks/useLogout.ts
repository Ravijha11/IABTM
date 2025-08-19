import { useCallback } from 'react';
import { useAuthStore } from '@/storage/authStore';

export const useLogout = () => {
  const { setUser } = useAuthStore();

  const logout = useCallback(async () => {
    try {
      // Clear local storage and session storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Clear all cookies manually
      if (typeof document !== 'undefined') {
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
      }

      // Call the logout API
      const response = await fetch("/api/auth/logout", { 
        method: "GET", 
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      // Clear auth store state
      setUser(null);
      
      // Force redirect to sign-in page
      if (typeof window !== 'undefined') {
        window.location.href = "/sign-in";
      }
    } catch (e) {
      console.error('Logout error:', e);
      
      // Even if API fails, clear state and redirect
      setUser(null);
      
      // Clear local storage and session storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Force redirect to sign-in page
      if (typeof window !== 'undefined') {
        window.location.href = "/sign-in";
      }
    }
  }, [setUser]);

  return { logout };
}; 