'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getActiveFlashSales, getRemainingStock, getTimeRemaining } from '@/services/flashSaleService';
import { FlashSale } from '@/types';

export default function FlashSales() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadFlashSales();
  }, []);

  // Update countdown timers every second
  useEffect(() => {
    if (flashSales.length === 0) return;

    const interval = setInterval(() => {
      const newTimeLeft: { [key: string]: string } = {};
      let hasEndedSale = false;
      
      flashSales.forEach(sale => {
        const remaining = getTimeRemaining(sale);
        newTimeLeft[sale.id] = formatTimeRemaining(remaining);
        
        // Check if any sale has ended
        if (remaining <= 0) {
          hasEndedSale = true;
        }
      });
      
      setTimeLeft(newTimeLeft);
      
      // Reload flash sales if any sale ended
      if (hasEndedSale) {
        loadFlashSales();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [flashSales]);

  const loadFlashSales = async () => {
    try {
      const sales = await getActiveFlashSales();
      setFlashSales(sales);
      
      // Initialize time left for each sale
      const initialTimeLeft: { [key: string]: string } = {};
      sales.forEach(sale => {
        initialTimeLeft[sale.id] = formatTimeRemaining(getTimeRemaining(sale));
      });
      setTimeLeft(initialTimeLeft);
    } catch (error) {
      console.error('Error loading flash sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return 'ENDED';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-80"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (flashSales.length === 0) {
    return null; // Don't show section if no active flash sales
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-24 py-8 md:py-12 bg-gray-100">
      {/* Section Header */}
      <div className="mb-6 md:mb-8">
        <div className="gap-4">
          <div className="text-black">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              Flash Sales
            </h2>
          </div>
          <div className="text-gray-600 text-sm md:text-lg mt-1">
            Limited Time Offers - Grab Them Fast!
          </div>
        </div>
      </div>

      {/* Flash Sale Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {flashSales.map((sale) => {
          const remainingStock = getRemainingStock(sale);
          const stockPercentage = (remainingStock / sale.stockLimit) * 100;
          const isLowStock = stockPercentage < 30;
          
          return (
            <Link 
              key={sale.id} 
              href={`/shop/products/${sale.productId}`}
              className="group"
            >
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative">
                {/* Discount Badge */}
                <div className="absolute top-1.5 md:top-2 left-1.5 md:left-2 z-10 bg-gradient-to-r from-purple-200 to-violet-200 text-purple-600 rounded text-xs font-bold px-2 md:px-3 py-0.5 md:py-1">
                  -{sale.discountPercentage}%
                </div>

                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  <Image
                    src={sale.productImage}
                    alt={sale.productName}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  
                  {/* Low Stock Warning */}
                  {isLowStock && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-xs py-1 text-center font-semibold">
                      Only {remainingStock} left!
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-2 md:p-3 lg:p-4">
                  <h3 className="font-semibold text-xs md:text-sm lg:text-base text-gray-900 mb-1 md:mb-2 line-clamp-2 transition">
                    {sale.productName}
                  </h3>

                  {/* Price Section */}
                  <div className="mb-2 md:mb-3">
                    <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                      <span className="text-base md:text-lg lg:text-xl font-bold text-purple-600">
                        ₹{sale.salePrice}
                      </span>
                      <span className="text-[10px] md:text-xs text-gray-500 line-through">
                        ₹{sale.originalPrice}
                      </span>
                    </div>
                    <div className="text-[10px] md:text-xs text-green-600 font-semibold">
                      Save ₹{sale.originalPrice - sale.salePrice}
                    </div>
                  </div>

                  <hr className="my-2" />

                  {/* Countdown Timer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
                    <span className="text-[10px] md:text-xs text-gray-600">Ends in: </span>
                    <span className="text-[10px] md:text-xs text-red-600 font-semibold">
                      {timeLeft[sale.id] || 'Loading...'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
