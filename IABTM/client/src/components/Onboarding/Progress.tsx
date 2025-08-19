import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { 
    fractionValue?: string;
  }
>(({ className, value, fractionValue, ...props }, ref) => {
  // Parse fraction value if provided (e.g., "1/5", "2/5")
  const calculatedValue = React.useMemo(() => {
    if (fractionValue) {
      const [numerator, denominator] = fractionValue.split('/').map(Number);
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return (numerator / denominator) * 100;
      }
    }
    return value || 0;
  }, [fractionValue, value]);

  return (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          'relative h-1 w-full overflow-hidden rounded-full bg-secondary',
          className
        )}
        value={calculatedValue}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className="h-full w-full flex-1 bg-[#2F80ED] transition-all"
          style={{ transform: `translateX(-${100 - calculatedValue}%)` }}
        />
      </ProgressPrimitive.Root>
      
      {fractionValue && (
        <div 
          className="absolute top-3 text-xs font-medium text-[#2E2E2E] shadow-sm p-1 rounded-sm "
          style={{ 
            left: `calc(${calculatedValue}% - 8px)`,
            transform: calculatedValue > 95 ? 'translateX(-100%)' : 'none'
          }}
        >
          {fractionValue}
        </div>
      )}
    </div>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };