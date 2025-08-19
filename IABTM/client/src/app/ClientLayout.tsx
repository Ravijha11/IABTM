// app/ClientLayout.tsx
"use client"

import { useAuthStore } from "@/storage/authStore"
import { useEffect } from "react"
import axios from "axios"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/me/profile`,
          {
            withCredentials: true,
            timeout: 10000 // 10 second timeout
          }
        );

        if (response.data.statusCode === 200) {
          setUser(response.data.data);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        
        // Handle different error types
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 503) {
            console.log('Database temporarily unavailable - will retry on next page load');
          } else if (error.response?.status === 401) {
            console.log('User not authenticated');
          } else if (error.response?.status === 404) {
            console.log('Auth endpoint not found - user not logged in');
          } else {
            console.log('Auth check failed:', error.response?.status, error.response?.data);
          }
        }
        
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure cookies are set after login
    const timer = setTimeout(() => {
      checkAuthStatus();
    }, 1000);

    return () => clearTimeout(timer);
  }, [setUser, setLoading]);

  return <>{children}</>;
}