import React from 'react';
import Image from 'next/image';

interface ProfileCardProps {
    name: string;
    role: 'Mentor' | 'Psychiatrist' | 'Volunteer';
    imageSrc: string;
    altText?: string;
    message?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
    name,
    role,
    imageSrc,
    altText = 'Profile picture',
    message
}) => {
    // Role-based styling
    const getRoleBadgeStyle = () => {
        return "inline-block px-2 py-1 text-xs font-medium bg-white border border-gray-200 rounded";
    };

    return (
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="relative w-full h-80">
                <Image
                    src={imageSrc}
                    alt={`${name}'s profile picture`}
                    fill
                    className='w-full h-full object-cover rounded-t-lg'
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                />
            </div>
            <div className="p-3">
                <div className="mb-2">
                    <span className={getRoleBadgeStyle()}>
                        {role}
                    </span>
                </div>
                <h3 className="font-medium text-gray-900">{name}</h3>
                {message && <div className="text-sm text-gray-500">{message}</div>}
            </div>
        </div>
    );
};

export default ProfileCard;