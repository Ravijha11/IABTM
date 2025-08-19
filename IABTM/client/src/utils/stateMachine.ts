import { useState, useEffect, useCallback } from 'react';

// State machine for audio room lifecycle
export type AudioRoomState = 
  | 'idle'
  | 'joining'
  | 'connecting'
  | 'live'
  | 'muted'
  | 'speaking'
  | 'disconnecting'
  | 'ended'
  | 'error';

export type AudioRoomEvent = 
  | 'JOIN_ROOM'
  | 'CONNECTION_ESTABLISHED'
  | 'CONNECTION_FAILED'
  | 'MUTE_MIC'
  | 'UNMUTE_MIC'
  | 'START_SPEAKING'
  | 'STOP_SPEAKING'
  | 'LEAVE_ROOM'
  | 'CONNECTION_LOST'
  | 'ERROR_OCCURRED'
  | 'RESET';

// State transition interface
interface StateTransition {
  from: AudioRoomState;
  to: AudioRoomState;
  event: AudioRoomEvent;
  condition?: () => boolean;
  action?: () => void;
}

// Audio Room State Machine
export class AudioRoomStateMachine {
  private currentState: AudioRoomState = 'idle';
  protected transitions: StateTransition[] = [];
  private stateHistory: Array<{ state: AudioRoomState; timestamp: number }> = [];
  private listeners: Map<AudioRoomState, Array<() => void>> = new Map();

  constructor() {
    this.initializeTransitions();
  }

  private initializeTransitions(): void {
    this.transitions = [
      // Idle state transitions
      { from: 'idle', to: 'joining', event: 'JOIN_ROOM' },
      { from: 'idle', to: 'error', event: 'ERROR_OCCURRED' },
      
      // Joining state transitions
      { from: 'joining', to: 'connecting', event: 'CONNECTION_ESTABLISHED' },
      { from: 'joining', to: 'error', event: 'CONNECTION_FAILED' },
      { from: 'joining', to: 'idle', event: 'LEAVE_ROOM' },
      
      // Connecting state transitions
      { from: 'connecting', to: 'live', event: 'CONNECTION_ESTABLISHED' },
      { from: 'connecting', to: 'error', event: 'CONNECTION_FAILED' },
      { from: 'connecting', to: 'idle', event: 'LEAVE_ROOM' },
      
      // Live state transitions
      { from: 'live', to: 'muted', event: 'MUTE_MIC' },
      { from: 'live', to: 'speaking', event: 'START_SPEAKING' },
      { from: 'live', to: 'disconnecting', event: 'LEAVE_ROOM' },
      { from: 'live', to: 'error', event: 'ERROR_OCCURRED' },
      
      // Muted state transitions
      { from: 'muted', to: 'live', event: 'UNMUTE_MIC' },
      { from: 'muted', to: 'speaking', event: 'START_SPEAKING' },
      { from: 'muted', to: 'disconnecting', event: 'LEAVE_ROOM' },
      { from: 'muted', to: 'error', event: 'ERROR_OCCURRED' },
      
      // Speaking state transitions
      { from: 'speaking', to: 'live', event: 'STOP_SPEAKING' },
      { from: 'speaking', to: 'muted', event: 'MUTE_MIC' },
      { from: 'speaking', to: 'disconnecting', event: 'LEAVE_ROOM' },
      { from: 'speaking', to: 'error', event: 'ERROR_OCCURRED' },
      
      // Disconnecting state transitions
      { from: 'disconnecting', to: 'ended', event: 'CONNECTION_LOST' },
      { from: 'disconnecting', to: 'error', event: 'ERROR_OCCURRED' },
      
      // Error state transitions
      { from: 'error', to: 'idle', event: 'RESET' },
      
      // Ended state transitions
      { from: 'ended', to: 'idle', event: 'RESET' }
    ];
  }

  // Get current state
  getCurrentState(): AudioRoomState {
    return this.currentState;
  }

  // Get state history
  getStateHistory(): Array<{ state: AudioRoomState; timestamp: number }> {
    return [...this.stateHistory];
  }

  // Check if transition is valid
  canTransition(event: AudioRoomEvent): boolean {
    return this.transitions.some(transition => 
      transition.from === this.currentState && 
      transition.event === event &&
      (!transition.condition || transition.condition())
    );
  }

  // Get available events for current state
  getAvailableEvents(): AudioRoomEvent[] {
    return this.transitions
      .filter(transition => transition.from === this.currentState)
      .map(transition => transition.event);
  }

  // Get all transitions (for controller access)
  getTransitions(): StateTransition[] {
    return [...this.transitions];
  }

  // Update transitions (for controller access)
  updateTransitions(newTransitions: StateTransition[]): void {
    this.transitions = [...newTransitions];
  }

  // Transition to new state
  transition(event: AudioRoomEvent): boolean {
    const transition = this.transitions.find(t => 
      t.from === this.currentState && 
      t.event === event &&
      (!t.condition || t.condition())
    );

    if (!transition) {
      console.warn(`Invalid transition: ${this.currentState} -> ${event}`);
      return false;
    }

    const previousState = this.currentState;
    this.currentState = transition.to;
    
    // Execute transition action
    if (transition.action) {
      try {
        transition.action();
      } catch (error) {
        console.error('Error executing transition action:', error);
        this.currentState = 'error';
      }
    }

    // Record state change
    this.stateHistory.push({
      state: this.currentState,
      timestamp: Date.now()
    });

    // Notify listeners
    this.notifyListeners(previousState, this.currentState);

    console.log(`State transition: ${previousState} -> ${this.currentState} (${event})`);
    return true;
  }

  // Add state change listener
  onStateChange(state: AudioRoomState, callback: () => void): () => void {
    if (!this.listeners.has(state)) {
      this.listeners.set(state, []);
    }
    
    this.listeners.get(state)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(state);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Notify listeners of state change
  private notifyListeners(previousState: AudioRoomState, newState: AudioRoomState): void {
    // Notify listeners for the new state
    const newStateListeners = this.listeners.get(newState);
    if (newStateListeners) {
      newStateListeners.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in state change listener:', error);
        }
      });
    }

    // Notify general state change listeners
    const generalListeners = this.listeners.get('*' as AudioRoomState);
    if (generalListeners) {
      generalListeners.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in general state change listener:', error);
        }
      });
    }
  }

  // Reset state machine
  reset(): void {
    this.currentState = 'idle';
    this.stateHistory = [];
    console.log('State machine reset to idle');
  }

  // Get time spent in current state
  getTimeInCurrentState(): number {
    if (this.stateHistory.length === 0) return 0;
    
    const lastEntry = this.stateHistory[this.stateHistory.length - 1];
    return Date.now() - lastEntry.timestamp;
  }

  // Check if state machine is in a stable state
  isStable(): boolean {
    return ['idle', 'live', 'muted', 'ended'].includes(this.currentState);
  }

  // Get state machine statistics
  getStats(): {
    totalTransitions: number;
    timeInCurrentState: number;
    isStable: boolean;
    availableEvents: AudioRoomEvent[];
  } {
    return {
      totalTransitions: this.stateHistory.length,
      timeInCurrentState: this.getTimeInCurrentState(),
      isStable: this.isStable(),
      availableEvents: this.getAvailableEvents()
    };
  }
}

// Hook for using state machine in React components
export const useAudioRoomStateMachine = () => {
  const [stateMachine] = useState(() => new AudioRoomStateMachine());
  const [currentState, setCurrentState] = useState<AudioRoomState>('idle');

  useEffect(() => {
    const unsubscribe = stateMachine.onStateChange('*' as AudioRoomState, () => {
      setCurrentState(stateMachine.getCurrentState());
    });

    return unsubscribe;
  }, [stateMachine]);

  const transition = useCallback((event: AudioRoomEvent) => {
    return stateMachine.transition(event);
  }, [stateMachine]);

  const canTransition = useCallback((event: AudioRoomEvent) => {
    return stateMachine.canTransition(event);
  }, [stateMachine]);

  return {
    currentState,
    transition,
    canTransition,
    getStats: () => stateMachine.getStats(),
    getAvailableEvents: () => stateMachine.getAvailableEvents(),
    reset: () => stateMachine.reset()
  };
};

// Audio room state machine with business logic
export class AudioRoomController {
  private stateMachine: AudioRoomStateMachine;
  private roomId: string;
  private userId: string;
  private socket: any;

  constructor(roomId: string, userId: string, socket: any) {
    this.roomId = roomId;
    this.userId = userId;
    this.socket = socket;
    this.stateMachine = new AudioRoomStateMachine();
    this.setupStateMachine();
  }

  private setupStateMachine(): void {
    // Add business logic to transitions
    const transitions = this.stateMachine.getTransitions();
    const updatedTransitions = transitions.map(transition => {
      switch (transition.event) {
        case 'JOIN_ROOM':
          return {
            ...transition,
            action: () => {
              this.socket.emit('join-audio-room', { roomId: this.roomId, userId: this.userId });
            }
          };
        
        case 'CONNECTION_ESTABLISHED':
          return {
            ...transition,
            action: () => {
              this.socket.emit('audio-room-ready', { roomId: this.roomId, userId: this.userId });
            }
          };
        
        case 'MUTE_MIC':
          return {
            ...transition,
            action: () => {
              this.socket.emit('mute-mic', { roomId: this.roomId, userId: this.userId });
            }
          };
        
        case 'UNMUTE_MIC':
          return {
            ...transition,
            action: () => {
              this.socket.emit('unmute-mic', { roomId: this.roomId, userId: this.userId });
            }
          };
        
        case 'LEAVE_ROOM':
          return {
            ...transition,
            action: () => {
              this.socket.emit('leave-audio-room', { roomId: this.roomId, userId: this.userId });
            }
          };
        
        default:
          return transition;
      }
    });
    
    // Update the state machine with new transitions
    this.stateMachine.updateTransitions(updatedTransitions);
  }

  // Public methods for controlling the audio room
  joinRoom(): boolean {
    return this.stateMachine.transition('JOIN_ROOM');
  }

  muteMic(): boolean {
    return this.stateMachine.transition('MUTE_MIC');
  }

  unmuteMic(): boolean {
    return this.stateMachine.transition('UNMUTE_MIC');
  }

  leaveRoom(): boolean {
    return this.stateMachine.transition('LEAVE_ROOM');
  }

  // Handle external events
  handleConnectionEstablished(): void {
    this.stateMachine.transition('CONNECTION_ESTABLISHED');
  }

  handleConnectionFailed(): void {
    this.stateMachine.transition('CONNECTION_FAILED');
  }

  handleConnectionLost(): void {
    this.stateMachine.transition('CONNECTION_LOST');
  }

  handleError(): void {
    this.stateMachine.transition('ERROR_OCCURRED');
  }

  // Get current state
  getCurrentState(): AudioRoomState {
    return this.stateMachine.getCurrentState();
  }

  // Check if can perform action
  canJoin(): boolean {
    return this.stateMachine.canTransition('JOIN_ROOM');
  }

  canMute(): boolean {
    return this.stateMachine.canTransition('MUTE_MIC');
  }

  canUnmute(): boolean {
    return this.stateMachine.canTransition('UNMUTE_MIC');
  }

  canLeave(): boolean {
    return this.stateMachine.canTransition('LEAVE_ROOM');
  }
} 