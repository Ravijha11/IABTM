"use client"

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import PersonalDetails from "@/pages/Onboarding/PersonalDetails";

import React from 'react'

function page() {
  return (
    <div>
        <Navbar/>
        <PersonalDetails/>
        <Footer/>
    </div>
  )
}

export default page