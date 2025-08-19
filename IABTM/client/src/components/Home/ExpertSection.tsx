import React from "react";
import { Card, CardContent } from "../ui/card";

export const ExpertSection: React.FC = () => {
    // Data for the expert cards
    const expertRows = [
        [
            {
                name: "Ricky McClure",
                location: "New York",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-6.svg",
                width: "163px",
            },
            {
                name: "Cheryl Hills",
                location: "Lake Adella",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-14.svg",
                width: "247px",
            },
            {
                name: "Dora Hermiston",
                location: "Daviston",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-22.svg",
                width: "247px",
            },
            {
                name: "Lowell Kuphal",
                location: "North Aliyaville",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-19.svg",
                width: "247px",
            },
            {
                name: "Melinda Boehm",
                location: "Frisco",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-5.svg",
                width: "247px",
            },
            {
                name: "Theresa Daugherty",
                location: "Kamrenchester",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-17.svg",
                width: "247px",
            },
            {
                name: "Jane Lynch",
                location: "Bristol",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-8.svg",
                width: "247px",
            },
            {
                name: "Cory Ratke",
                location: "Stokesmouth",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-10.svg",
                width: "191px",
            },
        ],
        [
            {
                name: "Mrs. Neal Luettgen",
                location: "New York",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-11.svg",
                width: "163px",
            },
            {
                name: "Kenny Stracke",
                location: "Othochester",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-23.svg",
                width: "247px",
            },
            {
                name: "Thelma Pagac",
                location: "New Johnnie",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-15.svg",
                width: "247px",
            },
            {
                name: "Janice Blick",
                location: "Janaton",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-2.svg",
                width: "247px",
            },
            {
                name: "Vivian Wiza",
                location: "Port Abner",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273.svg",
                width: "247px",
            },
            {
                name: "Tricia Collier",
                location: "Elzatown",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-7.svg",
                width: "247px",
            },
            {
                name: "Sonja Miller",
                location: "Rolfsonfort",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-3.svg",
                width: "247px",
            },
            {
                name: "Mike Welch",
                location: "Sparks",
                image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-6.svg",
                width: "163px",
            },
        ],
    ];

    return (
        <section className="flex mt-10 flex-col items-center gap-10 w-full">
            <div className="flex items-start justify-center w-full max-w-[1600px]">
            <h2 className="text-3xl text-center font-bold">
                        People about I Am Better Than Me
                    </h2>
            </div>

            <div className="flex flex-col  w-full overflow-x-hidden">
                {expertRows.map((row, rowIndex) => (
                    <div key={`row-${rowIndex}`} className="flex gap-3 ">
                        {row.map((expert, index) => (
                            <Card
                                key={`${expert.name}-${index}`}
                                className="rounded-lg overflow-hidden border-0 shadow-none flex-shrink-0"
                            >
                                <CardContent className="p-0 relative h-[298px]">
                                    <img
                                        className="w-full h-full object-cover"
                                        alt={`Portrait of ${expert.name}`}
                                        src={expert.image}
                                    />
                                    <div className="absolute bottom-4 left-4 flex flex-col">
                                        <span className="font-medium text-white text-sm">
                                            {expert.location}
                                        </span>
                                        <span className="font-medium text-white text-2xl">
                                            {expert.name}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ))}
            </div>
        </section>
    );
};