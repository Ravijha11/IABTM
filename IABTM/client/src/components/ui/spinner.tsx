import React from "react";

export default function Spinner() {
    return (
        <div className="mb-12 w-full">
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-500">Loading...</span>
            </div>
        </div>
    )
}