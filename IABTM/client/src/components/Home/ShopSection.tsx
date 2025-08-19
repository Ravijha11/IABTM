import React, { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { useCollectionProducts } from "@/hooks/useCollectionProduct";
import { Product } from "@/lib/shopify/types";
import { useAllProducts } from "@/hooks/useAllProducts";
import { useCart } from "@/context/Cart";
import { useRouter } from "next/navigation";

const IABTMRecommendations = () => {
  const { data: products, isLoading, error } = useCollectionProducts('iabtm-recommends');
  const { handleAddToCartWithAuth } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -clientWidth : clientWidth,
      behavior: "smooth",
    });
  };

  const handleAddToCart = (product: Product) => {
    handleAddToCartWithAuth({
      id: product.id,
      title: product.title,
      description: product.description,
      image: product.image || '',
      price: parseFloat(product.price) || 0,
      quantity: 1,
      storeType: 'main',
    });
  };

  const handleProductClick = (product: Product) => {
    // Navigate to the specific product page
    if (product.id) {
      const encodedId = encodeURIComponent(product.id);
      router.push(`/shop/${encodedId}`);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading products: {error.message}</div>;

  return (
    <div className="flex flex-col items-start gap-10 w-full">
      <div className="flex w-full items-start justify-center relative pt-6 sm:pt-0">
        <h2 className="text-3xl text-center font-bold">
          IABTM recommends
        </h2>

        {/* Carousel Navigation */}
        <div className="flex items-start gap-2 absolute top-0.5 right-0 ">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("left")}
            className="p-2.5 bg-grey-100 rounded-[50px]"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("right")}
            className="p-2.5 bg-white rounded-[50px]"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </Button>
          <Button
            onClick={() => router.push('/shop')}
            className="px-4 py-2 bg-[#2e2e2e] text-white rounded-[50px] hover:bg-[#1a1a1a] ml-2"
          >
            View All
          </Button>
        </div>
      </div>

      {/* Displaying Products in a Scrollable Row */}
      <div
        ref={scrollRef}
        className="flex w-full overflow-x-auto no-scrollbar gap-6 scroll-smooth"
      >
        {products?.map((product: Product, index: number) => (
          <Card
            key={product.id || index}
            className="flex-shrink-0 transition-all ease-in cursor-pointer flex-col p-0 gap-6 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 h-[597px] rounded-[8px_8px_0px_0px] overflow-hidden border-none hover:shadow-lg hover:scale-105"
            onClick={() => handleProductClick(product)}
          >
            <img
              className="w-full h-4/5 sm:h-4/5 object-cover"
              alt={product.altText || product.title}
              src={product.image || ''}
            />
            <CardContent className="p-4 w-full">
              <div className="flex flex-col w-full items-start gap-4">
                <h3 className="text-xl font-semibold w-full truncate">{product.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 w-full truncate">{product.description}</p>
                <div className="flex items-center justify-between w-full mt-auto">
                  <span className="text-xl font-bold">
                    ${product.price}
                  </span>
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation(); // Prevent card click when button is clicked
                      handleAddToCart(product);
                    }}
                    className="px-5 text-lg py-2 bg-[#2e2e2e] text-white rounded-[50px] hover:bg-[#1a1a1a] transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
          
        ))}
      </div>
    </div>
  );
};

export default IABTMRecommendations;
