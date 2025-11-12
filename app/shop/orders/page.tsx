'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserOrders } from '@/services/orderService';
import { Order } from '@/types/order';
import Link from 'next/link';

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/shop/orders');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userOrders = await getUserOrders(user.uid);
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Order['orderStatus']) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['orderStatus']) => {
    switch (status) {
      case 'processing':
        return '⏳';
      case 'shipped':
        return '🚚';
      case 'delivered':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '📦';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your orders</p>
        </div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
            <Link
              href="/shop/products"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/shop/orders/${order.id}`}
                className="block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer border-2 border-transparent hover:border-purple-200"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left Section - Order Info */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="text-3xl sm:text-4xl flex-shrink-0 group-hover:scale-110 transition-transform">
                        {getStatusIcon(order.orderStatus)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                            Order ID
                          </p>
                          <p className="font-bold text-gray-900 text-lg">
                            #{order.id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Placed on {formatDate(order.createdAt)}</span>
                          </div>
                          <span className="hidden sm:inline text-gray-300">•</span>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Amount & Status */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                          Total Amount
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          ₹{order.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold capitalize ${getStatusColor(
                          order.orderStatus
                        )}`}
                      >
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Click indicator footer */}
                <div className="px-5 sm:px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between group-hover:bg-purple-50 transition-colors">
                  <span className="text-sm text-gray-600 group-hover:text-purple-700 font-medium transition-colors">
                    View order details
                  </span>
                  <svg 
                    className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

