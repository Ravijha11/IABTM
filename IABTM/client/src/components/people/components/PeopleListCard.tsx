// components/UserCard.tsx
import axios from 'axios';
import { MoreVertical } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';

interface PeopleCardProps {
  id: string;
  name: string;
  image: string;
  online?: boolean;
}

export default function PeopleCard({ id, name, image, online }: PeopleCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const handleAddFriend = async (personId) => {
    try {
      console.log(personId)
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/friend/send-request`,
        { recipientId: personId },
        { withCredentials: true }
      );

      if (res.data.statusCode === 200) { 
        toast.success('Friend request sent successfully!');
      } else {
        toast.error(res.data.message);
      }
      setMenuOpen(false);
    } catch (error) {
      toast.error('Failed to send friend request. Please try again later.');
    }
  };
  
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
    <div className="relative">
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
          <button
            onClick={() => handleAddFriend(id)}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Add Friend
          </button>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={2000} />  

    </div>  
  );
}
