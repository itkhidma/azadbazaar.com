'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { searchProducts } from '@/services/productService';
import { getAllCategories } from '@/services/categoryService';
import { Product } from '@/types';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  isMobile?: boolean;
}

export default function SearchBar({ className, placeholder = "Search products...", isMobile = false }: SearchBarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    console.log('Fetching suggestions for:', query);
    try {
      const results = await searchProducts(query);
      console.log('Search results:', results);
      setSuggestions(results.slice(0, 8)); // Limit to 8 suggestions
      setShowSuggestions(results.length > 0 || true); // Show even if empty for "no results"
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Input changed:', value);
    setSearchQuery(value);
    setSelectedIndex(-1);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer - 500ms delay
    debounceTimer.current = setTimeout(() => {
      console.log('Debounce timer fired for:', value);
      fetchSuggestions(value);
    }, 500);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch(e as any);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          navigateToProduct(suggestions[selectedIndex]);
        } else {
          handleSearch(e as any);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Navigate to product or search results
  const navigateToProduct = (product: Product) => {
    setShowSuggestions(false);
    setSearchQuery('');
    router.push(`/shop/products/${product.id}`);
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/shop/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Click suggestion
  const handleSuggestionClick = (product: Product) => {
    navigateToProduct(product);
  };

  // View all results
  const handleViewAllResults = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/shop/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const getCategoryName = (category: any): string => {
    if (typeof category === 'string') {
      const cat = categories.find((c) => c.id === category);
      return cat?.name || 'Unknown';
    }
    return category?.name || 'Unknown';
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="text-black w-full px-4 py-2 text-sm bg-transparent focus:outline-none"
        />
        <button
          type="submit"
          className={`absolute ${isMobile ? 'right-0' : 'right-2'} top-1/2 -translate-y-1/2 px-4 py-2 text-gray-500 hover:text-purple-600 transition`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-[100]">
          {suggestions.map((product, index) => (
            <div
              key={product.id}
              onClick={() => handleSuggestionClick(product)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${
                index === selectedIndex
                  ? 'bg-purple-50'
                  : 'hover:bg-gray-50'
              } ${index !== 0 ? 'border-t border-gray-100' : ''}`}
            >
              {/* Product Image */}
              <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded">
                <Image
                  src={product.imageUrls[0] || '/placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover rounded"
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {product.name}
                </h4>
                <p className="text-xs text-gray-500 truncate">
                  {getCategoryName(product.category)}
                </p>
              </div>

              {/* Price */}
              <div className="text-sm font-semibold text-purple-600">
                ₹{product.price}
              </div>
            </div>
          ))}

          {/* View All Results */}
          <button
            onClick={handleViewAllResults}
            className="w-full px-4 py-3 text-sm font-medium text-purple-600 hover:bg-purple-50 transition border-t border-gray-200"
          >
            View all results for "{searchQuery}"
          </button>
        </div>
      )}

      {/* No Results */}
      {showSuggestions && suggestions.length === 0 && searchQuery.length >= 2 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-[100]">
          <p className="text-sm text-gray-500 text-center">
            No products found for "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
}
