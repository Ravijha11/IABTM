import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CharacterCardProps {
  heading?: string;
  description?: string;
  bgColor: string;
  imagePosition?: string;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  heading,
  description,
  bgColor,
  imagePosition
}) => {
  return (
    <div
      className={cn(
        "p-4 rounded-xl transition-all duration-300 w-48 h-72",
        heading ? "" : " pt-20",
        bgColor
      )}

    >
      <div className={cn(
        "",
      )}>
        <div className="flex-1">
          <h2 className="text-3xl font-semibold mb-1">{heading} </h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className="w-24 h-24 relative mt-18">
          <Image
            src={imagePosition === "left" ? "/onboarding/current-self.svg" : "/onboarding/imagine-self.svg"}
            alt="image"
            fill
            className={` absolute object-contain ${imagePosition === "left" ? "-ml-8" : "ml-24"} bottom-0 ${imagePosition === "left" ? "top-0" : "bottom-0"}  scale-200`}
          />
        </div>
      </div>
    </div>
  );
};