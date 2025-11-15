'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllCategories } from '@/services/categoryService';
import { Category } from '@/types';

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white py-8">
        <div className="container mx-auto">
          <div className="animate-pulse flex gap-4 overflow-x-auto px-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0">
                <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                <div className="w-16 h-3 bg-gray-200 rounded mt-2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white py-6 border-b border-gray-100">
      <div className="container mx-auto">
        {/* Centered Category Grid */}
        <div className="flex gap-4 md:gap-6 lg:gap-8 overflow-x-auto scrollbar-hide pb-2 px-4 md:justify-center">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop/products?category=${category.id}`}
              className="group flex flex-col items-center flex-shrink-0"
            >
              {/* Circular Category Image */}
              <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-purple-200 hover:border-purple-500 transition-all duration-300">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-2xl md:text-3xl lg:text-4xl">🍓</div>
                  </div>
                )}
              </div>

              {/* Category Name */}
              <div className="mt-2 text-center max-w-[80px] md:max-w-[100px]">
                <h3 className="text-xs md:text-sm font-medium text-gray-900 group-hover:text-purple-600 transition truncate">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
          
          {/* All Categories Link */}
          <Link
            href="/shop/products"
            className="group flex flex-col items-center flex-shrink-0"
          >
            <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden bg-purple-50 transition-all duration-300 flex items-center justify-center">
              <div className="text-purple-600 group-hover:text-purple-700 transition">
                <svg className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-center max-w-[80px] md:max-w-[100px]">
              <h3 className="text-xs md:text-sm font-medium text-gray-900 group-hover:text-purple-600 transition">
                All
              </h3>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
