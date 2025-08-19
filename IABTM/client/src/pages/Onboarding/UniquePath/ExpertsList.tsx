import React from 'react';
import ProfileCard from '@/components/Onboarding/UniquePath/ExpertCard';
import SectionHeader from '@/components/Onboarding/UniquePath/SectionHeader';

interface Expert {
    id: number;
    name: string;
    role: 'Mentor' | 'Psychiatrist' | 'Volunteer';
    imageSrc: string;
    message: string;
}

export default function ExpertsMediaListPage() {
    // Local data array storing all expert information
    const experts: Expert[] = [
        {
            id: 1,
            name: 'Omar Marvin',
            role: 'Mentor',
            imageSrc: 'https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-6.svg',
            message: 'Message'
        },
        {
            id: 2,
            name: 'Samuel Kuvalis',
            role: 'Psychiatrist',
            imageSrc: 'https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-14.svg',
            message: 'Message'
        },
        {
            id: 3,
            name: 'Eloise Vandervort',
            role: 'Volunteer',
            imageSrc: 'https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-22.svg',
            message: 'Message'
        },
        {
            id: 4,
            name: 'Heather Boyer',
            role: 'Mentor',
            imageSrc: 'https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-19.svg',
            message: 'Message'
        },
        {
            id: 5,
            name: 'Marian Parker',
            role: 'Mentor',
            imageSrc: 'https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-5.svg',
            message: 'Message'
        },
        {
            id: 6,
            name: 'Harry Franecki',
            role: 'Mentor',
            imageSrc: 'https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-17.svg',
            message: 'Message'
        },
        {
            id: 7,
            name: 'Samuel Kuvalis',
            role: 'Psychiatrist',
            imageSrc: 'https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-8.svg',
            message: 'Message'
        },
        // {
        //     id: 8,
        //     name: 'Omar Marvin',
        //     role: 'Mentor',
        //     imageSrc: 'https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-10.svg',
        //     message: 'Heather Boyer'
        // },
        // {
        //     id: 9,
        //     name: 'Eloise Vandervort',
        //     role: 'Volunteer',
        //     imageSrc: 'https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-11.svg',
        //     message: 'Message'
        // },
        // {
        //     id: 10,
        //     name: 'Omar Marvin',
        //     role: 'Mentor',
        //     imageSrc: 'https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-23.svg',
        //     message: 'Message'
        // }
    ];


    return (
        <div className="container mx-auto px-4 py-8">
            <SectionHeader title="Personal experts list based on information from your attributes and media preferences" />


            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {experts.map((expert) => (
                    <ProfileCard
                        key={expert.id}
                        name={expert.name}
                        role={expert.role}
                        imageSrc={expert.imageSrc}
                        message={expert.message}
                    />
                ))}
            </div>
        </div>
    );
}