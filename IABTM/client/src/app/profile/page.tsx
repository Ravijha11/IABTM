"use client"
import React, { useState } from "react";
import CategoryTabs from "./components/Tabs";
import General from "./components/General";
import Attributes from "./components/Attributes";
import Paths from "./components/Paths";
import Payments from "./components/Payments";
import Security from "./components/Security";

export default function ProfilePage() { 
    const [activeCategory, setActiveCategory] = useState("General");
    
    const renderCategoryComponent = () => {
        switch (activeCategory) {
        case 'General':
            return <General/>;
        case 'Attributes':
            return <Attributes />;
        case 'Paths':
            return <Paths />;
        case 'Payment Methods':
            return <Payments/>;
        case 'Security':
            return <Security />;
        }
    };

    return (
        <div>
            <CategoryTabs activeCategory={activeCategory} setActiveCategory={setActiveCategory}/>
        
            <div>
                {renderCategoryComponent()}
            </div>
        </div>
    )
}