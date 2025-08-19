// components/UserCard.tsx
import axios from 'axios';
import { MoreVertical } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface UserCardProps {
  id: string;
  name: string;
  image: string;
  online?: boolean;
  onUpdate: () => void;
}

export default function UserCard({id, name, image, online, onUpdate }: UserCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const handleRemoveFriend = async (friendId: string) => { 
    try {
      // console.log('Removing friend with ID:', friendId);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/friend/remove-friend`,
        { friendId: friendId },
        { withCredentials: true }
      );
      // console.log('Response from server:', res.data);
      if (res.data.statusCode === 200) { 
        toast.success('Friend removed successfully!');
        onUpdate?.();
      } else {
        toast.error(res.data.messages);
      }
      setMenuOpen(false);
    } catch (error) {
      toast.error('Failed to remove friend. Please try again later.');
    }
  }

  const handleChatClick = (friendId: string, friendName: string) => {
    console.log('Chat clicked for friend:', { friendId, friendName });
    // Navigate to 3605-feed with chat parameters
    const url = `/3605-feed?chat=personal&recipientId=${friendId}&recipientName=${encodeURIComponent(friendName)}`;
    console.log('Navigating to:', url);
    
    try {
      router.push(url);
      console.log('Navigation initiated successfully');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: try window.location
      window.location.href = url;
    }
    
    setMenuOpen(false);
  }

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setMenuOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

  return (
    <div className='relative'>
      <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
        <div className="flex items-center space-x-4">
          <img src={image} alt={name} className="w-12 h-12 rounded-full object-cover" />
          <div>
            <p className="font-medium">{name}</p>
            {online && <span className="text-sm text-blue-500">Online</span>}
          </div>
        </div>
        <button onClick={() => setMenuOpen((prev) => !prev)}>
          <MoreVertical className="text-gray-500 hover:text-black" />
        </button>
      </div>
      {menuOpen && (
          <div ref={menuRef} className="absolute right-4 top-10 mt-2 w-40 bg-white shadow-lg border rounded-md z-10">
            <button onClick={() => handleRemoveFriend(id)} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Remove Friend
            </button>
            <button 
              onClick={() => handleChatClick(id, name)} 
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Chat
            </button>
          </div>
      )}
      <ToastContainer position='top-right' autoClose={2000} />
    </div>  
  );
}
