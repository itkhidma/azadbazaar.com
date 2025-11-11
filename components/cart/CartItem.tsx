'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CartItem as CartItemType } from '@/types';
import { useEffect, useState } from 'react';
import { getAllCategories } from '@/services/categoryService';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  loading?: boolean;
}

export default function CartItem({ item, onUpdateQuantity, onRemove, loading }: CartItemProps) {
  const { product, quantity, productId } = item;
  const subtotal = product.price * quantity;
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      const categoriesData = await getAllCategories();
      setCategories(categoriesData);
    };
    loadCategories();
  }, []);

  const getCategoryName = (category: string | any) => {
    if (typeof category === 'string') {
      const cat = categories.find((c) => c.id === category);
      return cat?.name || 'Unknown';
    }
    return category?.name || 'Unknown';
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      onUpdateQuantity(productId, newQuantity);
    }
  };

  return (
    <div className="flex gap-4 bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition">
      {/* Product Image */}
      <Link href={`/shop/products/${productId}`} className="flex-shrink-0">
        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={product.imageUrls[0] || '/images/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover hover:scale-105 transition"
          />
        </div>
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link href={`/shop/products/${productId}`}>
              <h3 className="font-semibold text-gray-900 hover:text-purple-600 transition truncate">
                {product.name}
              </h3>
            </Link>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {product.description}
            </p>
            
            {/* Category Badge */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {getCategoryName(product.category)}
              </span>
              {product.stock < 10 && product.stock > 0 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                  Only {product.stock} left!
                </span>
              )}
            </div>
          </div>

          {/* Price (Desktop) */}
          <div className="hidden md:block text-right">
            <p className="text-lg font-bold text-purple-600">
              ₹{product.price.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">per item</p>
          </div>
        </div>

        {/* Quantity Controls & Actions */}
        <div className="flex items-center justify-between mt-4">
          {/* Quantity Selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">Quantity:</span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={loading || quantity <= 1}
                className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="px-4 py-1 font-semibold text-gray-900 min-w-[40px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={loading || quantity >= product.stock}
                className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Subtotal & Remove */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500 md:hidden">Price</p>
              <p className="text-lg font-bold text-gray-900">
                ₹{subtotal.toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => onRemove(productId)}
              disabled={loading}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
              title="Remove from cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stock Warning */}
        {quantity > product.stock && (
          <p className="text-sm text-red-600 mt-2">
            Only {product.stock} items available in stock
          </p>
        )}
      </div>
    </div>
  );
}
