"use client";
import Blogs from "@/components/blogs/page";
import Navbar from "@/components/layout/Navbar";
import React from "react";
import Footer from "@/components/layout/Footer";

export default function Blog() { 
    return (
        <div>
            <div className="shadow-sm  ">
                <Navbar />
            </div>
            <div className="m-5 px-20">
                <h1 className="text-2xl font-bold mb-10 text-gray-900">IABTM blogs</h1>
                <Blogs />
            </div>
            <Footer />
        </div>
    )
}