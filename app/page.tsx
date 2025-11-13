'use client';

import { useEffect } from 'react';
import BannerCarousel from "@/components/home/BannerCarousel";
import FlashSales from "@/components/home/FlashSales";
import CategoryGrid from "@/components/home/CategoryGrid";
import BestSellers from "@/components/home/BestSellers";
import NewArrivals from "@/components/home/NewArrivals";
import { cleanupExpiredFlashSales } from "@/utils/flashSaleCleanup";

export default function Home() {
  useEffect(() => {
    // Clean up expired flash sales on page load
    cleanupExpiredFlashSales().catch(error => {
      console.error('Failed to cleanup expired flash sales:', error);
    });
  }, []);

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
