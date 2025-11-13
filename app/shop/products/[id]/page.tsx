'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProductById } from '@/services/productService';
import { getCategoryById } from '@/services/categoryService';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types';
import ProductReviews from '@/components/products/ProductReviews';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const data = await getProductById(productId);
      setProduct(data);
      
      // Fetch category name if category is an ID
      if (data && data.category) {
        if (typeof data.category === 'string') {
          // Category is an ID, fetch the category name
          try {
            const category = await getCategoryById(data.category);
            setCategoryName(category?.name || 'Unknown');
          } catch (error) {
            console.error('Error loading category:', error);
            setCategoryName('Unknown');
          }
        } else {
          // Category is already an object
          setCategoryName(data.category.name || 'Unknown');
        }
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      // Show success message or redirect to cart
      alert('Added to cart!');
    } catch (error: any) {
      // Show user-friendly error message
      alert(error.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    await handleAddToCart();
    router.push('/shop/cart');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-200 h-96 rounded-lg"></div>
            <div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
        <Link
          href="/shop/products"
          className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 sm:mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <Link href="/" className="hover:text-purple-600">Home</Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/shop/products" className="hover:text-purple-600">Products</Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 truncate max-w-[150px] sm:max-w-none">{product.name}</li>
        </ol>
      </nav>

      {/* Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
        {/* Left Column - Images */}
        <div>
          {/* Main Image */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4 aspect-square">
            <Image
              src={product.imageUrls[selectedImage] || '/placeholder.jpg'}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {product.imageUrls.length > 1 && (
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {product.imageUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition ${
                    selectedImage === index
                      ? 'border-purple-600'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div>
          {/* Category */}
          <p className="text-sm text-purple-600 font-medium mb-2">
            {categoryName || 'Loading...'}
          </p>

          {/* Product Name */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            {product.name}
          </h1>

          {/* Price */}
          <div className="mb-4 sm:mb-6">
            {product.isOnFlashSale && product.flashSaleEndDate && product.flashSaleEndDate > new Date() ? (
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl sm:text-4xl font-bold text-purple-600">
                    ₹{product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xl sm:text-2xl text-gray-500 line-through">
                      ₹{product.originalPrice}
                    </span>
                  )}
                  {product.flashSaleDiscountPercentage && (
                    <span className="bg-gradient-to-r from-purple-200 to-violet-200 text-purple-600 text-sm font-bold px-3 py-1 rounded">
                      -{product.flashSaleDiscountPercentage}% OFF
                    </span>
                  )}
                </div>
                {product.originalPrice && (
                  <p className="text-sm text-green-600 font-semibold">
                    ⚡ Flash Sale - Save ₹{product.originalPrice - product.price}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-bold text-purple-600">
                  ₹{product.price}
                </span>
              </div>
            )}
          </div>

          {/* Stock Status */}
          <div className="mb-4 sm:mb-6">
            {product.stock > 0 ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">
                  {product.stock < 10 ? `Only ${product.stock} left in stock` : 'In Stock'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-red-600">Out of Stock</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <div 
              className="prose prose-sm sm:prose lg:prose-lg text-gray-700 max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>

          {/* Product Video */}
          {product.videoUrl && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Video</h3>
              <video
                src={product.videoUrl}
                controls
                className="w-full rounded-lg border border-gray-200"
                style={{ maxHeight: '400px' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-black w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
                  disabled={quantity <= 1}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                  className="text-black w-20 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  max={product.stock}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="text-black w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
                  disabled={quantity >= product.stock}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addingToCart}
              className="flex-1 px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0 || addingToCart}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buy Now
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>100% Authentic Product</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Secure Payment Options</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span>Free Shipping on Orders Above ₹500</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <ProductReviews productId={productId} />
      </div>
    </div>
  );
}
