'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllFlashSales, deleteFlashSale, getTimeRemaining, getRemainingStock } from '@/services/flashSaleService';
import { FlashSale } from '@/types';

export default function FlashSalesListPage() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFlashSales();
  }, []);

  const loadFlashSales = async () => {
    try {
      const data = await getAllFlashSales();
      setFlashSales(data);
    } catch (error) {
      console.error('Error loading flash sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFlashSale(id);
      setFlashSales(flashSales.filter(sale => sale.id !== id));
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting flash sale:', error);
      alert('Failed to delete flash sale');
    }
  };

  const getStatus = (sale: FlashSale) => {
    const now = new Date();
    if (!sale.isActive) return { text: 'Inactive', color: 'gray' };
    if (now < sale.startDate) return { text: 'Scheduled', color: 'blue' };
    if (now > sale.endDate) return { text: 'Ended', color: 'red' };
    if (sale.soldCount >= sale.stockLimit) return { text: 'Sold Out', color: 'orange' };
    return { text: 'Active', color: 'green' };
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredFlashSales = flashSales.filter(sale =>
    sale.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flash Sales</h1>
          <p className="text-gray-600 mt-1">{flashSales.length} total flash sales</p>
        </div>
        <Link
          href="/admin/flash-sales/new"
          className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-red-700 transition font-semibold"
        >
          ⚡ Add Flash Sale
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search flash sales by product name..."
          className="text-black w-full md:w-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Flash Sales Table */}
      {filteredFlashSales.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-50 to-red-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFlashSales.map((sale) => {
                  const status = getStatus(sale);
                  const remaining = getRemainingStock(sale);
                  
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image
                              src={sale.productImage}
                              alt={sale.productName}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{sale.productName}</div>
                            <div className="text-sm text-gray-500">ID: {sale.productId.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-lg font-bold text-red-600">₹{sale.salePrice}</div>
                          <div className="text-sm text-gray-500 line-through">₹{sale.originalPrice}</div>
                          <div className="text-xs font-semibold text-green-600">
                            {sale.discountPercentage}% OFF
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {sale.soldCount} / {sale.stockLimit}
                          </div>
                          <div className="text-xs text-gray-500">{remaining} remaining</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <div className="text-gray-700">
                            <span className="font-semibold">Start:</span> {formatDate(sale.startDate)}
                          </div>
                          <div className="text-gray-700 mt-1">
                            <span className="font-semibold">End:</span> {formatDate(sale.endDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                          ${status.color === 'green' ? 'bg-green-100 text-green-800' : ''}
                          ${status.color === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
                          ${status.color === 'red' ? 'bg-red-100 text-red-800' : ''}
                          ${status.color === 'orange' ? 'bg-orange-100 text-orange-800' : ''}
                          ${status.color === 'gray' ? 'bg-gray-100 text-gray-800' : ''}
                        `}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/flash-sales/${sale.id}/edit`}
                            className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => setDeleteId(sale.id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="text-6xl mb-4">⚡</div>
          <p className="text-gray-500 mb-4">No flash sales found</p>
          <Link
            href="/admin/flash-sales/new"
            className="inline-block text-orange-600 hover:text-orange-700 font-semibold"
          >
            Create your first flash sale
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Flash Sale</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this flash sale? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
