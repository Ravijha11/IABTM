import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface User {
  _id: string;
  name: string;
  profilePicture?: string;
  isOnline?: boolean;
}

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (room: any) => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated
}) => {
  const [step, setStep] = useState<'details' | 'users'>('details');
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Load users on mount
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedUsers.includes(user._id)
  );

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/user/get-all-users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!roomName.trim()) {
      setError('Room name is required');
      return;
    }
    setError('');
    setStep('users');
  };

  const handleBack = () => {
    setStep('details');
    setError('');
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateRoom = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    try {
      setCreating(true);
      setError('');

      const response = await axios.post('/api/group/create', {
        name: roomName,
        description: roomDescription,
        isMicEnabled,
        members: selectedUsers
      });

      if (response.data.success) {
        toast.success('Room created successfully!');
        onRoomCreated(response.data.data);
        handleClose();
      } else {
        setError(response.data.message || 'Failed to create room');
      }
    } catch (error: any) {
      console.error('Error creating room:', error);
      setError(error.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setStep('details');
    setRoomName('');
    setRoomDescription('');
    setIsMicEnabled(false);
    setSelectedUsers([]);
    setSearchQuery('');
    setError('');
    onClose();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  {step === 'details' ? 'Create New Room' : 'Add Members'}
                </Dialog.Title>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {step === 'details' ? (
                  /* Room Details Step */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Room Name *
                      </label>
                      <input
                        type="text"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Enter room name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={roomDescription}
                        onChange={(e) => setRoomDescription(e.target.value)}
                        placeholder="Enter room description"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="flex items-center justify-between">
                        <div>
                          <span className="block text-sm font-medium text-gray-700">
                            Enable Audio Room
                          </span>
                          <span className="block text-sm text-gray-500">
                            Allow voice chat in this room
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsMicEnabled(!isMicEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isMicEnabled ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isMicEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </label>
                    </div>

                    {isMicEnabled && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          <span className="text-sm font-medium text-blue-600">Audio Room Features</span>
                        </div>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li>• Real-time voice communication</li>
                          <li>• Mute/unmute controls</li>
                          <li>• Speaking indicators</li>
                          <li>• Text chat alongside voice</li>
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleNext}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Add Users Step */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Users
                      </label>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                      {loading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Loading users...</p>
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">
                            {searchQuery ? 'No users found' : 'No users available'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredUsers.map((user) => (
                            <div
                              key={user._id}
                              onClick={() => handleUserToggle(user._id)}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <div className="relative">
                                {user.profilePicture ? (
                                  <img
                                    src={user.profilePicture}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                    {getInitials(user.name)}
                                  </div>
                                )}
                                {user.isOnline && (
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                )}
                              </div>
                              <span className="flex-1 text-sm font-medium text-gray-900">
                                {user.name}
                              </span>
                              <div className={`w-4 h-4 rounded border-2 transition-colors ${
                                selectedUsers.includes(user._id)
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'border-gray-300'
                              }`}>
                                {selectedUsers.includes(user._id) && (
                                  <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedUsers.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Selected: {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between gap-3 pt-4">
                      <button
                        onClick={handleBack}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCreateRoom}
                        disabled={creating || selectedUsers.length === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creating ? 'Creating...' : 'Create Room'}
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CreateRoomModal; 