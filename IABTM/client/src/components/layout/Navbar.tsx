import React, { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/storage/authStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLogout } from '@/hooks/useLogout';

const Navbar: React.FC = () => {
    const navItems = [
        { name: "How it works?", href: "/how-it-works" },
        { name: "IABTM Podcast", href: "#" },
        { name: "Experts", href: "#" },
        { name: "3605", href: "/public-posts" },
        { name: "Shop", href: "/shop" },
    ];

    const { user, loading, setUser } = useAuthStore();
    const router = useRouter();
    const { logout } = useLogout();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownOpen]);

    // Logout handler
    const handleLogout = async () => {
        await logout();
    };

    // Profile handler
    const handleProfile = () => {
        router.push("/dashboard?section=Settings"); // We'll handle section switching in dashboard
        setDropdownOpen(false);
    };

    return (
        <nav>
            <div className="navbar-container">
                <header className="flex h-16 px-10 py-1 items-center justify-between w-full">
                    <img
                        className="w-36 h-16 cursor-pointer"
                        alt="IABTM Logo"
                        src="https://c.animaapp.com/m8nag6vuQg1Dnq/img/frame-217.svg"
                        onClick={() => {
                            window.location.href = "/";
                        }}
                    />

                    <div className="flex items-center gap-16">
                        <nav className="flex items-start gap-20">
                            {navItems.map((item, index) => (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className="w-fit font-medium text-black text-lg hover:text-gray-600 transition-colors"
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </nav>

                        {loading ? (
                            <Skeleton className="h-12 w-12 rounded-full" />
                        ) : user ? (
                            <div className="relative" ref={dropdownRef}>
                                <img
                                    src={user?.profilePicture || "/default-profile.svg"}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full cursor-pointer object-cover border-2 border-black p-1"
                                    onClick={() => setDropdownOpen((open) => !open)}
                                />
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 flex flex-col">
                                        <button
                                            className="px-4 py-2 text-left hover:bg-gray-100 rounded-t-lg"
                                            onClick={handleProfile}
                                        >
                                            Profile
                                        </button>
                                        <button
                                            className="px-4 py-2 text-left hover:bg-gray-100 rounded-b-lg text-red-600"
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Button
                                onClick={() => {
                                    window.location.href = "/sign-in";
                                }}
                                variant="outline"
                                className="px-10 py-4 cursor-pointer rounded-[80px] border border-solid border-[#2e2e2e] font-medium text-lg"
                            >
                                Sign in
                            </Button>
                        )}
                    </div>
                </header>
            </div>
        </nav>
    );
};

export default Navbar;
