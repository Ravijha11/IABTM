import React from "react";

export default function General() { 
    return (
        <form className="max-w-sm mx-auto p-4 space-y-4 text-sm font-sans">
        <div>
            <label className="block mb-1 text-gray-600">Name</label>
            <input
            name="name"
            defaultValue="Margaret Gerlach"
            className="w-full border border-gray-300 px-3 py-2 rounded"
            />
        </div>

        <div>
            <label className="block mb-1 text-gray-600">Profile name</label>
            <input
            name="profileName"
            defaultValue="MegaMeg"
            className="w-full border border-gray-300 px-3 py-2 rounded"
            />
        </div>

        <div>
            <label className="block mb-1 text-gray-600">Age</label>
            <input
            name="age"
            type="number"
            defaultValue="24"
            className="w-full border border-gray-300 px-3 py-2 rounded"
            />
        </div>

        <div>
            <label className="block mb-1 text-gray-600">Gender</label>
            <select
            name="gender"
            defaultValue="Female"
            className="w-full border border-gray-300 px-3 py-2 rounded"
            >
            <option>Female</option>
            <option>Male</option>
            <option>Non-binary</option>
            <option>Other</option>
            </select>
        </div>

        <div>
            <label className="block mb-1 text-gray-600">Email</label>
            <input
            name="email"
            type="email"
            defaultValue="meggy.gerl@gmail.com"
            className="w-full border border-gray-300 px-3 py-2 rounded"
            />
        </div>

        <div>
            <label className="block mb-1 text-gray-600">Phone</label>
            <input
            name="phone"
            type="tel"
            defaultValue="+1 212 588-88-52"
            className="w-full border border-gray-300 px-3 py-2 rounded"
            />
        </div>

        <button type="submit" className="w-full mt-4 py-2 text-white bg-black rounded-3xl hover:bg-gray-800 transition">
            Apply changes
        </button>
        </form>
    );
}