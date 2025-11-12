'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getNewArrivals } from '@/services/productService';
import { getAllCategories } from '@/services/categoryService';
import { Product, Category } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function NewArrivals() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getNewArrivals(8),
        getAllCategories()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading new arrivals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string | Category): string => {
    if (typeof categoryId === 'object' && categoryId.name) {
      return categoryId.name;
    }
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  // Check if product is new (added within last 30 days)
  const isNewProduct = (createdAt: Date) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(createdAt) > thirtyDaysAgo;
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      await addToCart(productId, 1);
      alert('Added to cart!');
    } catch (error: any) {
      alert(error.message || 'Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-80"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-24 py-8 md:py-12 bg-gradient-to-br from-purple-50 to-violet-50">
      {/* Section Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
              New Arrivals
            </h2>
            <p className="text-sm md:text-base text-gray-600">Fresh and latest additions to our collection</p>
          </div>
          <Link
            href="/shop/products"
            className="hidden md:inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold transition"
          >
            View All
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200"
          >
            {/* Product Image - Clickable */}
            <Link href={`/shop/products/${product.id}`} className="block">
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                <Image
                  src={product.imageUrls[0]}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                
                {/* Badges */}
                <div className="absolute top-1.5 md:top-2 left-1.5 md:left-2 flex flex-col gap-1">
                  {isNewProduct(product.createdAt) && (
                    <span className="text-center bg-gradient-to-r from-green-400 to-emerald-500 text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full shadow-md animate-pulse">
                      NEW
                    </span>
                  )}
                  {product.stock < 10 && product.stock > 0 && (
                    <span className="bg-red-500 text-white text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shadow-md">
                      Low Stock
                    </span>
                  )}
                  {product.stock === 0 && (
                    <span className="bg-gray-800 text-white text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shadow-md">
                      Sold Out
                    </span>
                  )}
                </div>

                {/* Date Added */}
                <div className="absolute top-1.5 md:top-2 right-1.5 md:right-2">
                  <div className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg shadow-md">
                    {new Date(product.createdAt).toLocaleDateString('en-IN', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            </Link>

            {/* Product Info */}
            <div className="p-2 md:p-3 lg:p-4">
              <Link href={`/shop/products/${product.id}`}>
                <h3 className="font-semibold text-xs md:text-sm lg:text-base text-gray-900 mb-1 truncate group-hover:text-purple-600 transition">
                  {product.name}
                </h3>
              </Link>
              
              {/* Category */}
              <p className="text-[10px] md:text-xs text-gray-500 mb-1 md:mb-2 truncate">
                {getCategoryName(product.category)}
              </p>

              {/* Price */}
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-lg lg:text-xl font-bold text-purple-600">
                  ₹{product.price}
                </span>
                
                {/* Add to Cart Button */}
                <button 
                  onClick={(e) => handleAddToCart(e, product.id)}
                  disabled={product.stock === 0}
                  className={`${
                    product.stock === 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  } text-white p-1.5 md:p-2 rounded-lg transition shadow-md`}
                >
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>

              {/* Recently Added Indicator */}
              <div className="mt-1 md:mt-2 flex items-center gap-1 text-[10px] md:text-xs text-emerald-600 font-medium">
                <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Just Added
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button (Mobile) */}
      <div className="mt-6 md:mt-8 text-center md:hidden">
        <Link
          href="/shop/products"
          className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold text-sm"
        >
          View All Products
        </Link>
      </div>
    </div>
  );
}
