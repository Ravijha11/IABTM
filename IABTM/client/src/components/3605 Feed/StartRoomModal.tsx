import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import axios from 'axios';

interface StartRoomModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onProceed: (roomTitle: string, micAccess: boolean) => void;
}

export default function StartRoomModal({ open, onClose, user, onProceed }: StartRoomModalProps) {
  const [roomTitle, setRoomTitle] = useState('');
  const [micAccess, setMicAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProceed = () => {
    if (!roomTitle.trim()) {
      setError('Room title is required');
      return;
    }
    setError(null);
    onProceed(roomTitle, micAccess);
    setRoomTitle('');
    setMicAccess(false);
    onClose();
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-transparent transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel style={{ width: 656, height: 450, borderRadius: 8, background: '#fff', padding: '24px 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
              {/* Close (X) Button */}
              <button
                onClick={onClose}
                aria-label="Close"
                style={{ position: 'absolute', top: 24, right: 24, width: 24, height: 24, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E2E2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <Dialog.Title style={{ fontFamily: 'Satoshi', fontWeight: 700, fontSize: 21, lineHeight: '120%', marginBottom: 8 }}>Start Your Room</Dialog.Title>
              
              {/* Host Info */}
              <div style={{ width: 608, height: 48, display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={user?.profilePicture || '/default-profile.svg'} alt="Host" style={{ width: 40, height: 40, borderRadius: 100, objectFit: 'cover' }} />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Satoshi', fontWeight: 700, fontSize: 16 }}>{user?.name || 'Host'}</span>
                  <span style={{ fontFamily: 'Satoshi', fontWeight: 400, fontSize: 14, color: '#8F8F8F' }}>Host</span>
                </div>
              </div>
              
              {/* Room Title Input */}
              <input
                type="text"
                placeholder="Your room title"
                value={roomTitle}
                onChange={e => setRoomTitle(e.target.value)}
                style={{ width: 608, height: 51, borderRadius: 8, border: '1px solid #EFEFEF', padding: 16, background: '#fff', fontFamily: 'Satoshi', fontWeight: 400, fontSize: 16, marginTop: 8, marginBottom: 8 }}
              />
              
              {/* Audio Room Feature Section */}
              <div style={{ width: 608, padding: 16, borderRadius: 8, background: micAccess ? '#F0F8FF' : '#F8F8F8', border: `1px solid ${micAccess ? '#2F80ED' : '#E5E5E5'}` }}>
                {/* Mic Access Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={() => setMicAccess(v => !v)}
                    style={{ 
                      width: 45, 
                      height: 30, 
                      borderRadius: 15, 
                      background: micAccess ? '#2F80ED' : '#EFEFEF', 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: 2, 
                      border: 'none', 
                      cursor: 'pointer', 
                      transition: 'background 0.2s' 
                    }}
                    aria-pressed={micAccess}
                  >
                    <span style={{
                      display: 'block',
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      background: '#fff',
                      marginLeft: micAccess ? 17 : 2,
                      transition: 'margin 0.2s'
                    }} />
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'Satoshi', fontWeight: 700, fontSize: 16, lineHeight: '120%', color: micAccess ? '#2F80ED' : '#2E2E2E' }}>
                      Enable Audio Room
                    </span>
                    <span style={{ fontFamily: 'Satoshi', fontWeight: 400, fontSize: 14, color: 'rgba(143, 143, 143, 1)' }}>
                      {micAccess ? 'Audio room will be available for voice chat' : 'Text-only chat room'}
                    </span>
                  </div>
                </div>
                
                {/* Feature Description */}
                {micAccess && (
                  <div style={{ 
                    padding: 12, 
                    borderRadius: 6, 
                    background: 'rgba(47, 128, 237, 0.1)', 
                    border: '1px solid rgba(47, 128, 237, 0.2)',
                    marginTop: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <svg width="16" height="16" fill="none" stroke="#2F80ED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M11 5L6 9H2v6h4l5 4V5z" />
                        <path d="M19 12c0-2.21-1.79-4-4-4" />
                        <path d="M19 12c0 2.21-1.79 4-4 4" />
                      </svg>
                      <span style={{ fontFamily: 'Satoshi', fontWeight: 600, fontSize: 14, color: '#2F80ED' }}>
                        Audio Room Features
                      </span>
                    </div>
                    <ul style={{ 
                      fontFamily: 'Satoshi', 
                      fontSize: 13, 
                      color: '#2F80ED', 
                      margin: 0, 
                      paddingLeft: 20,
                      lineHeight: '1.4'
                    }}>
                      <li>Real-time voice communication</li>
                      <li>Mute/unmute controls</li>
                      <li>Speaking indicators</li>
                      <li>Participant list with status</li>
                      <li>Text chat alongside voice</li>
                    </ul>
                  </div>
                )}
                
                {!micAccess && (
                  <div style={{ 
                    padding: 12, 
                    borderRadius: 6, 
                    background: 'rgba(143, 143, 143, 0.1)', 
                    border: '1px solid rgba(143, 143, 143, 0.2)',
                    marginTop: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <svg width="16" height="16" fill="none" stroke="#8F8F8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4" />
                        <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z" />
                        <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z" />
                      </svg>
                      <span style={{ fontFamily: 'Satoshi', fontWeight: 600, fontSize: 14, color: '#8F8F8F' }}>
                        Text-Only Chat
                      </span>
                    </div>
                    <span style={{ 
                      fontFamily: 'Satoshi', 
                      fontSize: 13, 
                      color: '#8F8F8F', 
                      lineHeight: '1.4'
                    }}>
                      This group will support text messaging only. Audio room features will not be available.
                    </span>
                  </div>
                )}
              </div>
              
              {/* Proceed Button */}
              <button
                style={{
                  width: 135,
                  height: 56,
                  borderRadius: 50,
                  background: 'rgba(46, 46, 46, 1)',
                  color: '#fff',
                  fontFamily: 'Satoshi',
                  fontWeight: 700,
                  fontSize: 18,
                  alignSelf: 'center',
                  marginTop: 'auto',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '16px 32px',
                  borderBottom: '2px solid rgba(46,46,46,1)'
                }}
                onClick={handleProceed}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Proceed'}
              </button>
              {error && <div style={{ color: 'red', textAlign: 'center', marginTop: 8 }}>{error}</div>}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 