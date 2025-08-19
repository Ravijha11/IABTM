// Message interface for binary search
export interface Message {
  _id: string;
  createdAt: string | Date;
  content: string;
  sender: any;
  [key: string]: any;
}

// Binary search to find message by timestamp
export function binarySearchByTimestamp(
  messages: Message[],
  targetTimestamp: Date | string,
  tolerance: number = 1000 // 1 second tolerance in milliseconds
): number {
  if (messages.length === 0) return -1;

  const target = typeof targetTimestamp === 'string' 
    ? new Date(targetTimestamp).getTime() 
    : targetTimestamp.getTime();

  let left = 0;
  let right = messages.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const messageTime = new Date(messages[mid].createdAt).getTime();
    
    // Check if we're within tolerance
    if (Math.abs(messageTime - target) <= tolerance) {
      return mid;
    }
    
    if (messageTime < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // Return closest match if exact match not found
  if (left < messages.length && right >= 0) {
    const leftTime = new Date(messages[left].createdAt).getTime();
    const rightTime = new Date(messages[right].createdAt).getTime();
    
    if (Math.abs(leftTime - target) < Math.abs(rightTime - target)) {
      return left;
    } else {
      return right;
    }
  }

  return left < messages.length ? left : right;
}

// Binary search to find message by ID
export function binarySearchById(
  messages: Message[],
  targetId: string
): number {
  if (messages.length === 0) return -1;

  let left = 0;
  let right = messages.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const messageId = messages[mid]._id;
    
    if (messageId === targetId) {
      return mid;
    }
    
    // Since IDs are not naturally ordered, we'll use string comparison
    if (messageId < targetId) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}

// Jump to message by timestamp with smooth scrolling
export function jumpToMessageByTimestamp(
  messages: Message[],
  targetTimestamp: Date | string,
  scrollToElement: (index: number) => void
): number {
  const index = binarySearchByTimestamp(messages, targetTimestamp);
  
  if (index !== -1) {
    // Add a small delay for smooth scrolling
    setTimeout(() => {
      scrollToElement(index);
    }, 100);
  }
  
  return index;
}

// Find messages within a time range
export function findMessagesInTimeRange(
  messages: Message[],
  startTime: Date | string,
  endTime: Date | string
): Message[] {
  if (messages.length === 0) return [];

  const start = typeof startTime === 'string' 
    ? new Date(startTime).getTime() 
    : startTime.getTime();
  
  const end = typeof endTime === 'string' 
    ? new Date(endTime).getTime() 
    : endTime.getTime();

  // Find start index
  let startIndex = 0;
  for (let i = 0; i < messages.length; i++) {
    const messageTime = new Date(messages[i].createdAt).getTime();
    if (messageTime >= start) {
      startIndex = i;
      break;
    }
  }

  // Find end index
  let endIndex = messages.length - 1;
  for (let i = startIndex; i < messages.length; i++) {
    const messageTime = new Date(messages[i].createdAt).getTime();
    if (messageTime > end) {
      endIndex = i - 1;
      break;
    }
  }

  return messages.slice(startIndex, endIndex + 1);
}

// Search messages by content with binary search optimization
export function searchMessagesByContent(
  messages: Message[],
  query: string,
  caseSensitive: boolean = false
): Message[] {
  if (!query.trim()) return messages;

  const searchQuery = caseSensitive ? query : query.toLowerCase();
  
  return messages.filter(message => {
    const content = caseSensitive 
      ? message.content 
      : message.content.toLowerCase();
    
    return content.includes(searchQuery);
  });
}

// Advanced message search with multiple criteria
export function advancedMessageSearch(
  messages: Message[],
  criteria: {
    query?: string;
    senderId?: string;
    startTime?: Date | string;
    endTime?: Date | string;
    messageType?: string;
  }
): Message[] {
  let results = messages;

  // Filter by time range first (most efficient)
  if (criteria.startTime || criteria.endTime) {
    const startTime = criteria.startTime || new Date(0);
    const endTime = criteria.endTime || new Date();
    results = findMessagesInTimeRange(results, startTime, endTime);
  }

  // Filter by sender
  if (criteria.senderId) {
    results = results.filter(message => 
      message.sender._id === criteria.senderId || 
      message.sender === criteria.senderId
    );
  }

  // Filter by message type
  if (criteria.messageType) {
    results = results.filter(message => 
      message.messageType === criteria.messageType
    );
  }

  // Filter by content query (most expensive, do last)
  if (criteria.query) {
    results = searchMessagesByContent(results, criteria.query);
  }

  return results;
}

// Message search index for faster lookups
export class MessageSearchIndex {
  private messages: Message[] = [];
  private timestampIndex: Map<number, number> = new Map(); // timestamp -> index
  private senderIndex: Map<string, number[]> = new Map(); // senderId -> indices
  private contentIndex: Map<string, number[]> = new Map(); // word -> indices

  constructor(messages: Message[] = []) {
    this.buildIndex(messages);
  }

  private buildIndex(messages: Message[]): void {
    this.messages = messages;
    this.timestampIndex.clear();
    this.senderIndex.clear();
    this.contentIndex.clear();

    messages.forEach((message, index) => {
      // Index by timestamp
      const timestamp = new Date(message.createdAt).getTime();
      this.timestampIndex.set(timestamp, index);

      // Index by sender
      const senderId = message.sender._id || message.sender;
      if (!this.senderIndex.has(senderId)) {
        this.senderIndex.set(senderId, []);
      }
      this.senderIndex.get(senderId)!.push(index);

      // Index by content words
      const words = message.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) { // Only index words longer than 2 characters
          if (!this.contentIndex.has(word)) {
            this.contentIndex.set(word, []);
          }
          this.contentIndex.get(word)!.push(index);
        }
      });
    });
  }

  // Fast search using pre-built indices
  search(criteria: {
    query?: string;
    senderId?: string;
    startTime?: Date | string;
    endTime?: Date | string;
  }): Message[] {
    let indices = new Set<number>();

    // Initialize with all indices
    this.messages.forEach((_, index) => indices.add(index));

    // Filter by sender
    if (criteria.senderId) {
      const senderIndices = this.senderIndex.get(criteria.senderId) || [];
      indices = new Set([...indices].filter(index => senderIndices.includes(index)));
    }

    // Filter by content query
    if (criteria.query) {
      const queryWords = criteria.query.toLowerCase().split(/\s+/);
      const matchingIndices = new Set<number>();
      
      queryWords.forEach(word => {
        const wordIndices = this.contentIndex.get(word) || [];
        wordIndices.forEach(index => matchingIndices.add(index));
      });
      
      indices = new Set([...indices].filter(index => matchingIndices.has(index)));
    }

    // Filter by time range
    if (criteria.startTime || criteria.endTime) {
      const start = criteria.startTime ? new Date(criteria.startTime).getTime() : 0;
      const end = criteria.endTime ? new Date(criteria.endTime).getTime() : Date.now();
      
      indices = new Set([...indices].filter(index => {
        const messageTime = new Date(this.messages[index].createdAt).getTime();
        return messageTime >= start && messageTime <= end;
      }));
    }

    return Array.from(indices).map(index => this.messages[index]);
  }

  // Update index when messages change
  updateIndex(messages: Message[]): void {
    this.buildIndex(messages);
  }
} 