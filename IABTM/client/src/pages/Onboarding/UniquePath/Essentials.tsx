import React from 'react';
import SectionHeader from '@/components/Onboarding/UniquePath/SectionHeader';
import { products } from '@/components/Home/HeroSection';
import Image from 'next/image';

export default function ExpertsMediaListPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <SectionHeader title="Personal products list based on information from your attributes and media preferences" />


            <div className=" flex  sm:flex-row flex-col w-full items-start gap-6">
                {products.map((product, index) => (
                    <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                        <div className="relative w-full h-80">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className='w-full h-full object-cover rounded-t-lg'
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                            />
                        </div>
                        <div className="p-3">
                            <div className="flex flex-col w-full items-start">
                                <div className="flex items-start gap-2.5 w-full">
                                    <span className="text-grey-500 text-sm ">
                                        {product.brand}
                                    </span>
                                </div>
                                <div className="flex flex-col items-start gap-4 w-full">
                                    <h3 className="text-xl">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-xl font-semibold leading-[1.2]">
                                            {product.price}
                                        </span>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                ))}
            </div>
        </div>
    );
}


{/* <Card
    key={index}
    className="flex flex-col p-0 gap-6 w-3/12  h-[597px] rounded-[8px_8px_0px_0px] overflow-hidden border-none"
>
    <img
        className="w-full h-9/12 object-cover"
        alt={product.name}
        src={product.image}
    />
    <CardContent className="p-0 w-full">
        <div className="flex flex-col w-full items-start">
            <div className="flex items-start gap-2.5 w-full">
                <span className="text-grey-500 text-sm ">
                    {product.brand}
                </span>
            </div>
            <div className="flex flex-col items-start gap-4 w-full">
                <h3 className="text-xl">
                    {product.name}
                </h3>
                <div className="flex items-center justify-between w-full">
                    <span className="text-xl font-bold leading-[1.2]">
                        {product.price}
                    </span>

                </div>
            </div>
        </div>
    </CardContent>
</Card> */}



