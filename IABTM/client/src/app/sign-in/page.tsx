"use client"

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import SignIn from '@/pages/Authentication/Signin';

import React from 'react'

function page() {
  return (
    <div>
        <Navbar/>
        <SignIn/>
        <Footer/>
    </div>
  )
}

export default page