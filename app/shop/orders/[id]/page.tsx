'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { getOrderById } from '@/services/orderService';
import { Order } from '@/types/order';
import Image from 'next/image';
import Link from 'next/link';

export default function OrderDetailsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/shop/orders');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && orderId) {
      loadOrder();
    }
  }, [user, orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const orderData = await getOrderById(orderId);
      if (orderData) {
        setOrder(orderData);
      } else {
        router.push('/shop/orders');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      router.push('/shop/orders');
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <Link
          href="/shop/orders"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold mb-6 hover:underline"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </Link>

        {/* Order Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{getStatusIcon(order.orderStatus)}</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Order #{order.id.slice(-8).toUpperCase()}
                </h1>
                <p className="text-gray-600 mt-1">Placed on {formatDate(order.createdAt)}</p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize self-start sm:self-center ${getStatusColor(
                order.orderStatus
              )}`}
            >
              {order.orderStatus}
            </span>
          </div>

          {/* Order Timeline */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Order Status</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  order.orderStatus === 'processing' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  ✓
                </div>
                <div>
                  <p className="font-medium text-gray-900">Order Placed</p>
                  <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              
              <div className="ml-4 border-l-2 border-gray-200 h-6"></div>
              
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  order.orderStatus === 'shipped' || order.orderStatus === 'delivered'
                    ? 'bg-green-500 text-white'
                    : order.orderStatus === 'processing'
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {order.orderStatus === 'shipped' || order.orderStatus === 'delivered' ? '✓' : '⏳'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Processing</p>
                  <p className="text-sm text-gray-600">
                    {order.orderStatus === 'processing' ? 'In progress...' : 'Completed'}
                  </p>
                </div>
              </div>
              
              <div className="ml-4 border-l-2 border-gray-200 h-6"></div>
              
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  order.orderStatus === 'delivered'
                    ? 'bg-green-500 text-white'
                    : order.orderStatus === 'shipped'
                    ? 'bg-purple-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {order.orderStatus === 'delivered' ? '✓' : order.orderStatus === 'shipped' ? '🚚' : '📦'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Shipped</p>
                  <p className="text-sm text-gray-600">
                    {order.orderStatus === 'shipped' ? 'Out for delivery...' : order.orderStatus === 'delivered' ? 'Completed' : 'Pending'}
                  </p>
                </div>
              </div>
              
              <div className="ml-4 border-l-2 border-gray-200 h-6"></div>
              
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  order.orderStatus === 'delivered'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {order.orderStatus === 'delivered' ? '✓' : '📍'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Delivered</p>
                  <p className="text-sm text-gray-600">
                    {order.orderStatus === 'delivered' ? formatDate(order.updatedAt) : 'Awaiting delivery'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Order Items ({order.items.length})
          </h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="relative w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.product?.imageUrls?.[0] || '/images/placeholder.png'}
                    alt={item.product?.name || 'Product'}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{item.product?.name}</p>
                  <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                  <p className="text-sm text-gray-600">Price: ₹{item.product?.price.toLocaleString()} each</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900 text-lg">
                    ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900 font-medium">{order.shippingAddress.street}</p>
            <p className="text-gray-700 mt-1">
              {order.shippingAddress.city}, {order.shippingAddress.state}
            </p>
            <p className="text-gray-700">
              {order.shippingAddress.zipCode}, {order.shippingAddress.country || 'India'}
            </p>
            {order.shippingAddress.landmark && (
              <p className="text-gray-600 text-sm mt-2">
                Landmark: {order.shippingAddress.landmark}
              </p>
            )}
          </div>
        </div>

        {/* Payment & Order Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal ({order.items.length} items)</span>
              <span>₹{order.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Delivery Charges</span>
              <span className="text-green-600 font-semibold">FREE</span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between">
              <span className="text-lg font-bold text-gray-900">Total Amount</span>
              <span className="text-2xl font-bold text-purple-600">
                ₹{order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Payment Method</span>
              <span className="text-gray-900 font-semibold">Cash on Delivery</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-700 font-medium">Payment Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                order.paymentStatus === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : order.paymentStatus === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {(order.orderStatus === 'processing' || order.orderStatus === 'shipped') && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
           
            <button className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition">
              Need Help?
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
