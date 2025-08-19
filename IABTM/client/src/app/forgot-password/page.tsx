"use client"

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import ForgotPassword from "@/pages/Authentication/ForgotPassword";

import React from 'react'

function page() {
  return (
    <div>
        <Navbar/>
        <ForgotPassword/>
        <Footer/>
    </div>
  )
}

export default page