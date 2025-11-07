'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAllProducts } from '@/services/productService';
import { addFlashSale } from '@/services/flashSaleService';
import { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function AddFlashSalePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    productId: '',
    salePrice: '',
    stockLimit: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    setFormData({
      ...formData,
      productId,
      stockLimit: product?.stock.toString() || '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const calculateDiscount = () => {
    if (!selectedProduct || !formData.salePrice) return 0;
    const discount = ((selectedProduct.price - parseFloat(formData.salePrice)) / selectedProduct.price) * 100;
    return Math.round(discount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    if (!formData.salePrice || !formData.stockLimit || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    const salePrice = parseFloat(formData.salePrice);
    if (salePrice >= selectedProduct.price) {
      setError('Sale price must be less than the original price');
      return;
    }

    if (salePrice <= 0) {
      setError('Sale price must be greater than 0');
      return;
    }

    const stockLimit = parseInt(formData.stockLimit);
    if (stockLimit > selectedProduct.stock) {
      setError(`Stock limit cannot exceed available stock (${selectedProduct.stock})`);
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (endDate <= startDate) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);

    try {
      const flashSaleData = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productImage: selectedProduct.imageUrls[0],
        originalPrice: selectedProduct.price,
        salePrice,
        discountPercentage: calculateDiscount(),
        stockLimit,
        startDate,
        endDate,
        isActive: formData.isActive,
        createdBy: user?.uid || 'admin',
      };

      await addFlashSale(flashSaleData);
      router.push('/admin/flash-sales');
    } catch (err: any) {
      setError(err.message || 'Failed to create flash sale');
      setLoading(false);
    }
  };

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">⚡ Create Flash Sale</h1>
        <p className="text-gray-600 mt-1">Set up a limited-time offer for a product</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Product Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Product <span className="text-red-500">*</span>
          </label>
          <select
            name="productId"
            value={formData.productId}
            onChange={(e) => handleProductSelect(e.target.value)}
            className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          >
            <option value="">-- Choose a product --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - ₹{product.price} (Stock: {product.stock})
              </option>
            ))}
          </select>
        </div>

        {/* Product Preview */}
        {selectedProduct && (
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Product Preview</h3>
            <div className="flex gap-4">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-white flex-shrink-0">
                <Image
                  src={selectedProduct.imageUrls[0]}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-lg mb-2">{selectedProduct.name}</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><span className="font-semibold">Original Price:</span> ₹{selectedProduct.price}</p>
                  <p><span className="font-semibold">Available Stock:</span> {selectedProduct.stock} units</p>
                  <p><span className="font-semibold">Category:</span> {typeof selectedProduct.category === 'string' ? selectedProduct.category : selectedProduct.category.name}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sale Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sale Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="salePrice"
              value={formData.salePrice}
              onChange={handleChange}
              placeholder="199"
              min="0"
              step="0.01"
              className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
            {selectedProduct && formData.salePrice && (
              <p className="text-xs text-green-600 mt-2 font-semibold">
                Discount: {calculateDiscount()}% OFF • Save ₹{(selectedProduct.price - parseFloat(formData.salePrice)).toFixed(2)}
              </p>
            )}
          </div>

          {/* Stock Limit */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Stock Limit <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="stockLimit"
              value={formData.stockLimit}
              onChange={handleChange}
              placeholder="50"
              min="1"
              max={selectedProduct?.stock || 1000}
              className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum units available for this flash sale
              {selectedProduct && ` (Available: ${selectedProduct.stock})`}
            </p>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Start Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              End Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
          />
          <div>
            <label className="font-semibold text-gray-900 cursor-pointer">
              Active Flash Sale
            </label>
            <p className="text-xs text-gray-600">
              Flash sale will be visible to customers if active and within date range
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedProduct}
            className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Flash Sale...' : '⚡ Create Flash Sale'}
          </button>
        </div>
      </form>
    </div>
  );
}
