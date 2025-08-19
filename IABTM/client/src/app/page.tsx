"use client"

import { ExpertSection } from "@/components/Home/ExpertSection";
import { HeroSection } from "@/components/Home/HeroSection";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Image from "next/image";


export default function Home() {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <ExpertSection />
      <Footer />
    </div>

  );
}
