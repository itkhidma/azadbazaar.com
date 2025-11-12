'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product, Category } from '@/types';
import { getAllCategories } from '@/services/categoryService';

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const getCategoryName = (categoryId: string | Category): string => {
    if (typeof categoryId === 'object' && categoryId.name) {
      return categoryId.name;
    }
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/shop/products/${product.id}`}
          className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
        >
          {/* Product Image */}
          <div className="relative h-48 bg-gray-100">
            <Image
              src={product.imageUrls[0] || '/placeholder.jpg'}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {product.stock < 10 && product.stock > 0 && (
              <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                Low Stock
              </span>
            )}
            {product.stock === 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                Out of Stock
              </span>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4">
            <p className="text-xs text-gray-500 mb-1">
              {getCategoryName(product.category)}
            </p>
            <h3 className="font-semibold text-gray-900 mb-2 truncate group-hover:text-purple-600 transition">
              {product.name}
            </h3>
            <div 
              className="text-sm text-gray-600 mb-3 line-clamp-2 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-purple-600">
                ₹{product.price}
              </span>
              <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition">
                View
              </button>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
