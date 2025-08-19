import axios from 'axios';
import React from 'react';
import { toast, ToastContainer } from 'react-toastify';

interface FriendRequestCardProps {
  id: string;
  name: string;
  image: string;
  onUpdateFriends: () => void;
  onUpdateRequests: () => void;
}

export default function FriendRequestCard({ id, name, image, onUpdateFriends,onUpdateRequests }: FriendRequestCardProps) {

  const handleConfirm = async (requesterId) => {
    try {
      // console.log('Accepting friend request for ID:', requesterId);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/friend/accept-request`,
        { requesterId: requesterId },
        { withCredentials: true }
      )
      // console.log('Response from accept request:', res.data);
      if (res.data.statusCode === 200) {
        toast.success(res.data.message);
        onUpdateFriends?.();
        onUpdateRequests?.();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request. Please try again later.');
    }
  }

  const handleCancle = async (requesterId) => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/friend/reject-request`,
        { requesterId: requesterId },
        { withCredentials: true }
      )
      if (res.data.statusCode === 200) {
        toast.success(res.data.message);
        onUpdateRequests?.();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to delete friend request. Please try again later.');
    }
  }

  return (
    <div className="bg-blue-100 p-4 rounded-lg flex items-center space-x-4">
      <img src={image} alt={name} className="w-12 h-12 rounded-full object-cover" />
      <div className="flex-1">
        <p className="font-semibold">{name}</p>
        <div className="mt-2 flex gap-2">
          <button onClick={()=>handleConfirm(id)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Confirm</button>
          <button onClick={()=>handleCancle(id)} className="bg-white border px-3 py-1 rounded hover:bg-gray-100">Delete</button>
        </div>
      </div>
      <ToastContainer position='top-right' autoClose={2000} />
    </div>
  );
}
