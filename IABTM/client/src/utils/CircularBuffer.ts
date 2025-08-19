export class CircularBuffer<T> {
  private buffer: T[];
  private head: number = 0;
  private tail: number = 0;
  private size: number = 0;
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  // Add element to buffer
  enqueue(element: T): boolean {
    if (this.isFull()) {
      return false; // Buffer is full
    }

    this.buffer[this.tail] = element;
    this.tail = (this.tail + 1) % this.capacity;
    this.size++;
    return true;
  }

  // Remove and return element from buffer
  dequeue(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    const element = this.buffer[this.head];
    this.head = (this.head + 1) % this.capacity;
    this.size--;
    return element;
  }

  // Peek at the next element without removing it
  peek(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.buffer[this.head];
  }

  // Get element at specific index
  get(index: number): T | undefined {
    if (index < 0 || index >= this.size) {
      return undefined;
    }
    return this.buffer[(this.head + index) % this.capacity];
  }

  // Check if buffer is empty
  isEmpty(): boolean {
    return this.size === 0;
  }

  // Check if buffer is full
  isFull(): boolean {
    return this.size === this.capacity;
  }

  // Get current size
  getSize(): number {
    return this.size;
  }

  // Get capacity
  getCapacity(): number {
    return this.capacity;
  }

  // Clear buffer
  clear(): void {
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  // Get all elements as array
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.size; i++) {
      result.push(this.buffer[(this.head + i) % this.capacity]!);
    }
    return result;
  }

  // Get available space
  getAvailableSpace(): number {
    return this.capacity - this.size;
  }

  // Check if buffer is more than X% full
  isMostlyFull(percentage: number = 0.8): boolean {
    return this.size >= this.capacity * percentage;
  }
}

// Specialized circular buffer for audio data
export class AudioCircularBuffer extends CircularBuffer<Float32Array> {
  private sampleRate: number;
  private channels: number;

  constructor(capacity: number, sampleRate: number = 44100, channels: number = 1) {
    super(capacity);
    this.sampleRate = sampleRate;
    this.channels = channels;
  }

  // Add audio data
  addAudioData(audioData: Float32Array): boolean {
    return this.enqueue(audioData);
  }

  // Get audio data for processing
  getAudioData(length: number): Float32Array | null {
    if (this.isEmpty() || length <= 0) {
      return null;
    }

    const result = new Float32Array(length);
    let index = 0;

    while (index < length && !this.isEmpty()) {
      const chunk = this.dequeue();
      if (chunk) {
        const copyLength = Math.min(chunk.length, length - index);
        result.set(chunk.subarray(0, copyLength), index);
        index += copyLength;

        // If we didn't use all of the chunk, put the rest back
        if (copyLength < chunk.length) {
          this.enqueue(chunk.subarray(copyLength));
        }
      }
    }

    return index > 0 ? result.subarray(0, index) : null;
  }

  // Get sample rate
  getSampleRate(): number {
    return this.sampleRate;
  }

  // Get number of channels
  getChannels(): number {
    return this.channels;
  }

  // Get duration of buffered audio in seconds
  getDuration(): number {
    const totalSamples = this.toArray().reduce((sum, chunk) => sum + chunk.length, 0);
    return totalSamples / this.sampleRate;
  }
}

// Voice activity detection buffer
export class VoiceActivityBuffer extends CircularBuffer<number> {
  private threshold: number;
  private silenceThreshold: number;
  private activityWindow: number;

  constructor(capacity: number, threshold: number = 0.1, silenceThreshold: number = 0.05, activityWindow: number = 10) {
    super(capacity);
    this.threshold = threshold;
    this.silenceThreshold = silenceThreshold;
    this.activityWindow = activityWindow;
  }

  // Add audio level
  addAudioLevel(level: number): void {
    this.enqueue(level);
  }

  // Detect if user is speaking
  isSpeaking(): boolean {
    if (this.getSize() < this.activityWindow) {
      return false;
    }

    const recentLevels = this.toArray().slice(-this.activityWindow);
    const averageLevel = recentLevels.reduce((sum, level) => sum + level, 0) / recentLevels.length;
    
    return averageLevel > this.threshold;
  }

  // Detect if user stopped speaking
  isSilent(): boolean {
    if (this.getSize() < this.activityWindow) {
      return true;
    }

    const recentLevels = this.toArray().slice(-this.activityWindow);
    const averageLevel = recentLevels.reduce((sum, level) => sum + level, 0) / recentLevels.length;
    
    return averageLevel < this.silenceThreshold;
  }

  // Get current audio level
  getCurrentLevel(): number {
    if (this.isEmpty()) {
      return 0;
    }
    return this.peek() || 0;
  }

  // Get average audio level over recent samples
  getAverageLevel(windowSize: number = 5): number {
    if (this.getSize() < windowSize) {
      return 0;
    }

    const recentLevels = this.toArray().slice(-windowSize);
    return recentLevels.reduce((sum, level) => sum + level, 0) / recentLevels.length;
  }
} 