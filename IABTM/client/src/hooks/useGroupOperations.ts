import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseGroupOperationsProps {
  groupId: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const useGroupOperations = ({ groupId, onSuccess, onError }: UseGroupOperationsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const leaveGroup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/group/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ groupId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to leave group');
      }

      onSuccess?.(data.message || 'Successfully left the group');
      
      // Redirect to groups list or dashboard
      router.push('/3605-feed');
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      onError?.(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addMember = async (memberId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/group/add-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ groupId, member: memberId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add member');
      }

      onSuccess?.(data.message || 'Member added successfully');
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      onError?.(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const initiateCall = async (callType: 'voice' | 'video') => {
    try {
      // This would integrate with your video calling service
      // For now, we'll just log the action
      console.log(`Initiating ${callType} call for group: ${groupId}`);
      
      // You can integrate with services like:
      // - Twilio Video
      // - Agora
      // - Daily.co
      // - Or your custom WebRTC solution
      
      onSuccess?.(`${callType} call initiated`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate call';
      onError?.(errorMessage);
    }
  };

  return {
    leaveGroup,
    addMember,
    initiateCall,
    isLoading,
  };
}; 