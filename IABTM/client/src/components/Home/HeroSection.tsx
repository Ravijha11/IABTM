"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import IABTMRecommendations from "./ShopSection";
import { useAuthStore } from "@/storage/authStore";


export const products = [
    // {
    //     name: "Ease the mind",
    //     brand: "Aisoway",
    //     price: "$44.99",
    //     image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-12.svg",
    // },
    // {
    //     name: "32 Pack Sensory Fidget Toys Set",
    //     brand: "Aisoway",
    //     price: "$44.99",
    //     image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-1.svg",
    // },
    {
        name: '"Eazy" wallpapers pack',
        brand: "Aisoway",
        price: "$44.99",
        image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-21.svg",
    },
    {
        name: 'Boxed "CosmoJam" water',
        brand: "Aisoway",
        price: "$44.99",
        image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-12.svg",
    },
];

export const HeroSection = () => {
    const { user } = useAuthStore();
    const router = useRouter();
    const animationVariants = {
        down: {
            first: {
                y: ["0%", "-100%", "-100%", "0%"], // Move out, pause, then move back
                times: [0, 0.4, 0.6, 1] // Pause between 40%-60% of the animation
            },
            second: {
                y: ["100%", "100%", "0%", "100%"], // Pause at start, move in, then move out
                times: [0, 0.4, 0.6, 1]
            },
        },
        left: {
            first: {
                x: ["0%", "-100%", "-100%", "0%"],
                times: [0, 0.4, 0.6, 1]
            },
            second: {
                x: ["100%", "100%", "0%", "100%"],
                times: [0, 0.4, 0.6, 1]
            },
        },
        right: {
            first: {
                x: ["0%", "100%", "100%", "0%"],
                times: [0, 0.4, 0.6, 1]
            },
            second: {
                x: ["-100%", "-100%", "0%", "-100%"],
                times: [0, 0.4, 0.6, 1]
            },
        },
        top: {
            first: {
                y: ["0%", "100%", "100%", "0%"],
                times: [0, 0.4, 0.6, 1]
            },
            second: {
                y: ["-100%", "-100%", "0%", "-100%"],
                times: [0, 0.4, 0.6, 1]
            },
        },
    };
    const scrollRef = useRef<HTMLDivElement>(null);
    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const { clientWidth } = scrollRef.current;
        scrollRef.current.scrollBy({
          left: direction === "left" ? -clientWidth : clientWidth,
          behavior: "smooth",
        });
      };
    // Experts data
    const experts = [
        {
            name: "Omar Marvin",
            role: "Mentor",
            image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-9.svg",
        },
        {
            name: "Samuel Kuvalis",
            role: "Psychiatrist",
            image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-20.svg",
        },
        {
            name: "Eloise Vandervort",
            role: "Volunteer",
            image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-4.svg",
        },
        {
            name: "Heather Boyer",
            role: "Mentor",
            image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-9.svg",
        },
        {
            name: "Omar Marvin",
            role: "Mentor",
            image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-9.svg",
        },
        {
            name: "Samuel Kuvalis",
            role: "Psychiatrist",
            image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-20.svg",
        },
        {
            name: "Eloise Vandervort",
            role: "Volunteer",
            image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-4.svg",
        },
        {
            name: "Heather Boyer",
            role: "Mentor",
            image: "https://c.animaapp.com/m8nag6vuQg1Dnq/img/rectangle-273-9.svg",
        },
    ];


    // Hero section image gallery
    const heroImages = [
        {
            url: "/assets/hero-image1.svg",
            width: "247px",
            height: "332px",
            top: "428px",
            left: "0",
            secondaryUrl: "/assets/hero-image2.svg",
        },
        {
            url: "/assets/hero-image2.svg",
            width: "247px",
            height: "188px",
            top: "572px",
            left: "271px",
            secondaryUrl: "/assets/hero-image1.svg",

        },
        {
            url: "/assets/hero-image3.svg",
            width: "247px",
            height: "369px",
            top: "391px",
            left: "541px",
            secondaryUrl: "/assets/hero-image4.svg",

        },
        {
            url: "/assets/hero-image5.svg",
            width: "247px",
            height: "369px",
            top: "179px",
            left: "271px",
            secondaryUrl: "/assets/hero-image3.svg",
        },
        {
            url: "/assets/hero-image4.svg",
            width: "247px",
            height: "369px",
            top: "0",
            left: "541px",
            secondaryUrl: "/assets/hero-image2.svg",
        },
    ];

    return (
        <section className="flex flex-col items-start  px-20 py-10 gap-y-24 w-full">
            {/* Header and Hero Section */}
            <div className="flex h-[85vh] gap-x-40 justify-between w-full">
                {/* Left Content */}
                <div className="flex flex-col pb-7 w-1/2  items-start justify-end gap-16">
                    <div className="flex flex-col items-start gap-6 w-full">
                        <h1 className="text-5xl font-bold leading-[1.2]">
                            Become the self <br />
                            you imagine
                        </h1>

                        <p className="text-xl">
                            We are a guide, curating a unique personalized path to the
                            self you imagine through media, products, pieces and
                            experiences.
                        </p>
                    </div>

                    <Button onClick={() => {
                        router.push(user ? "/dashboard" : "/onboarding");
                    }}
                        className="px-10 py-7 bg-black text-white rounded-[50px]  cursor-pointer font-medium text-2xl leading-6">
                        I want to be better
                    </Button>
                </div>

                {/* Right Image Gallery */}
                <div className="relative w-1/2   overflow-hidden">
                    {heroImages.map((image, index) => {
                        const direction = index % 4 === 0 ? "down" : index % 4 === 1 ? "left" : index % 4 === 2 ? "right" : "top";

                        return (
                            <div key={index} className="relative">
                                {/* Second Parent - Acts as a Viewport */}
                                <div
                                    className="absolute overflow-hidden"
                                    style={{ width: image.width, height: image.height, top: image.top, left: image.left }}
                                >
                                    {/* First Image */}
                                    <motion.div
                                        className="absolute w-full h-full"
                                        style={{
                                            backgroundImage: `url(${image.url})`,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                        }}
                                        variants={animationVariants[direction]}
                                        animate="first"
                                        transition={{
                                            duration: 5,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: index * 1,
                                        }}
                                    />
                                    {/* Second Image */}
                                    <motion.div
                                        className="absolute w-full h-full"
                                        style={{
                                            backgroundImage: `url(${image.secondaryUrl})`,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                        }}
                                        variants={animationVariants[direction]}
                                        animate="second"
                                        transition={{
                                            duration: 5,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: index * 1,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Experts Section */}
            <div className="flex flex-col items-start gap-10 w-full">
                {/* Header with Arrows */}
                <div className="flex w-full items-start justify-center relative pt-6 sm:pt-0">
                    <h2 className="text-3xl text-center font-bold">
                    Our Experts
                    </h2>

                    <div className="flex items-start gap-2 absolute top-0 right-2 sm:top-0.5 sm:right-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scroll("left")}
                        className="p-2.5 bg-grey-100 rounded-[50px]"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scroll("right")}
                        className="p-2.5 bg-white rounded-[50px]"
                    >
                        <ChevronRightIcon className="w-6 h-6" />
                    </Button>
                    </div>
                </div>

                {/* Experts Carousel */}
                <div
                    ref={scrollRef}
                    className="flex w-full overflow-x-auto no-scrollbar gap-6 scroll-smooth"
                >
                    {experts.map((expert, index) => (
                    <Card
                        key={index}
                        className="flex-shrink-0 flex flex-col p-0 gap-3.5 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 h-[400px] sm:h-[500px] md:h-[550px] rounded-[8px_8px_0px_0px] overflow-hidden border-none"
                    >
                        <img
                        className="w-full h-2/3 sm:h-5/6 object-cover"
                        alt={expert.name}
                        src={expert.image}
                        />
                        <CardContent className="p-4">
                        <div className="flex flex-col items-start gap-2">
                            <Badge
                            variant="outline"
                            className="px-3 text-xs border-gray-600 py-1"
                            >
                            {expert.role}
                            </Badge>
                            <h3 className="text-lg font-semibold">{expert.name}</h3>
                            <a
                            href="#"
                            className="inline-flex items-start border-b border-dotted border-[#2e2e2e]"
                            >
                            Profile
                            </a>
                        </div>
                        </CardContent>
                    </Card>
                    ))}
                </div>
            </div>

            {/* Dream Run Section */}
            <div className="flex flex-col w-full items-center gap-20 pt-10 h-[663px] px-0 bg-[#040507] rounded-lg overflow-hidden relative">
                <div className={`absolute w-full h-full  z-[0] top-[200px]  left-0`} style={{ backgroundImage: 'url("/assets/background-design.png")' }} />
                <div className="font-normal absolute z-20 top-28 text-white text-2xl">
                    A RACE TO YOUR DREAMS
                </div>
                <img
                    className="relative w-[1140px] h-[287px]"
                    alt="Dream run sample"
                    src={"/assets/DreamRun.svg"}
                />

                <Button
                    variant="outline"
                    className="px-6 absolute bottom-48 z-10 py-5 bg-white border border-solid border-[#2e2e2e] rounded-[50px]  font-medium text-lg"
                >
                    Learn more
                </Button>

            </div>

            {/* IABTM Recommends Section */}
           <IABTMRecommendations/>
        </section>
    );
};