// Debounce: Delays function execution until after a specified delay
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

// Throttle: Limits function execution to once per specified interval
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Advanced debounce with immediate option
export function debounceAdvanced<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const callNow = immediate && !timeoutId;
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        func(...args);
      }
    }, delay);
    
    if (callNow) {
      func(...args);
    }
  };
}

// Throttle with leading and trailing options
export function throttleAdvanced<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let previous = 0;
  const { leading = true, trailing = true } = options;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (!previous && !leading) {
      previous = now;
    }
    
    const remaining = limit - (now - previous);
    
    if (remaining <= 0 || remaining > limit) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      previous = now;
      func(...args);
    } else if (!timeoutId && trailing) {
      timeoutId = setTimeout(() => {
        previous = leading ? Date.now() : 0;
        timeoutId = null;
        func(...args);
      }, remaining);
    }
  };
}

// Specialized typing indicator debounce
export const createTypingDebounce = (delay: number = 1000) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (callback: () => void) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      callback();
      timeoutId = null;
    }, delay);
  };
};

// Specialized mic toggle throttle
export const createMicToggleThrottle = (limit: number = 500) => {
  let lastToggle = 0;
  
  return (callback: () => void) => {
    const now = Date.now();
    if (now - lastToggle >= limit) {
      callback();
      lastToggle = now;
    }
  };
}; 