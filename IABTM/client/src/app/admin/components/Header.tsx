'use client';

import React from 'react';

export default function Header() {
  return (
    <header className="bg-[#1976d2] text-white px-6 py-4 flex justify-between items-center shadow-md">
      <h2 className="text-lg font-semibold">IABTM Dashboard</h2>
      <div className="flex items-center gap-4">
        <h2 className="text-md">Hi, Admin</h2>
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-500 font-bold">
          A
        </div>
      </div>
    </header>
  );
}
