import Link from "next/link";
import React from "react";

export default function Footer() { 
    return (
        <footer className="flex justify-between items-center mt-8 ml-5 pt-4 border-t border-[#efefef] text-xs text-[#8f8f8f]">
            <div>
                
            </div>
            <div className="flex gap-4">
            <Link href="#" className="hover:text-[#2e2e2e]">
                Terms of Service
            </Link>
            <Link href="#" className="hover:text-[#2e2e2e]">
                Privacy Policy
            </Link>
            </div>
        </footer>
    )
}