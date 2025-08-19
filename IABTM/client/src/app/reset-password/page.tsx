"use client"

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import ResetPassword from "@/pages/Authentication/ResetPassword";

import React from 'react'

function page() {
  return (
    <div>
        <Navbar/>
        <ResetPassword/>
        <Footer/>
    </div>
  )
}

export default page