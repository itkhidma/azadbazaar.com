import Image from "next/image";
import BannerCarousel from "@/components/home/BannerCarousel";
import FlashSales from "@/components/home/FlashSales";
import CategoryGrid from "@/components/home/CategoryGrid";
import BestSellers from "@/components/home/BestSellers";
import NewArrivals from "@/components/home/NewArrivals";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Category Grid Section */}
      <CategoryGrid />

      {/* Banner Carousel */}
      <BannerCarousel />
      
      {/* Flash Sales Section */}
      <FlashSales />
      
      {/* Best Sellers Section */}
      <BestSellers />
      
      {/* New Arrivals Section */}
      <NewArrivals />
      
      {/* Rest of the home page content */}
      
    </div>
  );
}
