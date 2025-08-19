// components/MediaCard.tsx
import React from 'react';
import Image from 'next/image';
import { Eye, Pencil, X } from 'lucide-react';

export interface MediaCardProps {
    id: string;
    type: string;
    title: string;
    description: string;
    thumbnail: string;
    isViewed?: boolean;
    compact?: boolean;
    onClick?: () => void;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({
    id,
    type,
    title,
    description,
    thumbnail,
    isViewed ,
    compact = false,
    onClick,
    onDelete = () => { },
    onEdit = () => { },
}) => {
    const isAdmin = typeof window !== 'undefined' && window.location.href.includes('admin');
    
    const containerClasses = compact
        ? "flex gap-3 py-3"
        : "flex gap-4 py-4";

    const imageContainerClasses = compact
        ? "relative h-16 w-24 flex-shrink-0"
        : "relative h-24 w-40 flex-shrink-0";

    const imageClasses = compact
        ? "object-cover rounded-md"
        : "object-cover rounded-lg";

    const titleClasses = compact
        ? "font-medium mb-1"
        : "font-medium text-lg mb-1";

    const descriptionClasses = compact
        ? "text-sm text-gray-600"
        : "text-sm text-gray-600";

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't trigger onClick if clicking on admin buttons
        if (isAdmin && (e.target as HTMLElement).closest('button')) {
            return;
        }
        if (onClick) {
            onClick();
        }
    };

    return (
        <div 
            className={`${containerClasses} md:flex-row flex-col relative ${onClick ? 'cursor-pointer hover:bg-gray-50 transition-colors rounded-lg px-2' : ''}`}
            onClick={handleCardClick}
        >
            <div className={imageContainerClasses}>
                <Image
                    src={thumbnail}
                    alt={title}
                    fill
                    className={imageClasses}
                    sizes={compact ? "(max-width: 768px) 100vw, 96px" : "(max-width: 768px) 100vw, 160px"}
                />
                {/* Play icon overlay for video content */}
                {type === 'Video' && !isAdmin && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex flex-col flex-grow">
                {!compact && <div className="text-sm text-blue-500 mb-1">{type}</div>}
                <h3 className={titleClasses}>{title}</h3>
                <div className='max-w-xl'>
                    <p className={descriptionClasses}>{description}</p>
                </div>
                {!isAdmin && !compact && (
                    <>
                        {isViewed ? (
                            <button className="flex items-center mt-2 bg-[#EFEFEF] px-2 py-1 rounded w-fit">
                                <Eye className="scale-75 mr-1" />
                                <span className="text-xs text-gray-500">Viewed</span>
                            </button>
                        ) : (
                            <button className="flex items-center mt-2 bg-blue-500 px-2 py-1 rounded w-fit">
                                <Eye className="scale-75 mr-1 text-white" />
                                <span className="text-xs text-white">New</span>
                            </button>
                        )}
                    </>
                )}
            </div>

            {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-2">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(id);
                        }}
                        className="text-blue-500 hover:text-blue-700 cursor-pointer bg-white rounded-full p-1 shadow-sm"
                    >
                        <Pencil size={16} />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(id);
                        }}
                        className="text-red-500 hover:text-red-700 cursor-pointer bg-white rounded-full p-1 shadow-sm"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default MediaCard;
