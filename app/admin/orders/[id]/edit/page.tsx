'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getOrderById, updateOrderStatus, updatePaymentStatus } from '@/services/orderService';
import { Order } from '@/types/order';
import Image from 'next/image';
import Link from 'next/link';
import AdminOnly from '@/components/admin/AdminOnly';

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const orderData = await getOrderById(orderId);
      if (orderData) {
        setOrder(orderData);
      } else {
        alert('Order not found');
        router.push('/admin/orders');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Failed to load order');
      router.push('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (newStatus: Order['orderStatus']) => {
    if (!order) return;
    
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, newStatus);
      await loadOrder();
      alert('Order status updated successfully!');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePaymentStatus = async (newStatus: Order['paymentStatus']) => {
    if (!order) return;
    
    setUpdating(true);
    try {
      await updatePaymentStatus(order.id, newStatus);
      await loadOrder();
      alert('Payment status updated successfully!');
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: Order['orderStatus']) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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

  if (loading) {
    return (
      <AdminOnly>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </AdminOnly>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <AdminOnly>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold mb-6 hover:underline"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order #{order.id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-gray-600 mt-1">Placed on {formatDate(order.createdAt)}</p>
              <p className="text-sm text-gray-500 mt-1">Last updated: {formatDate(order.updatedAt)}</p>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize border-2 ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatus}
              </span>
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize border-2 ${getPaymentStatusColor(order.paymentStatus)}`}>
                Payment: {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Order Items ({order.items.length})
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
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
            <div className="bg-white rounded-xl shadow-sm p-6">
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
                  <p className="text-gray-600 text-sm mt-2">Landmark: {order.shippingAddress.landmark}</p>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Customer ID</p>
                  <p className="font-medium text-gray-900">{order.userId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Status Management */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Update Order Status</h3>
              <div className="space-y-2">
                {(['processing', 'shipped', 'delivered', 'cancelled'] as Order['orderStatus'][]).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateOrderStatus(status)}
                    disabled={updating || order.orderStatus === status}
                    className={`w-full px-4 py-3 rounded-lg font-semibold capitalize transition ${
                      order.orderStatus === status
                        ? getStatusColor(status) + ' border-2'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {status}
                    {order.orderStatus === status && ' ✓'}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Status Management */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Update Payment Status</h3>
              <div className="space-y-2">
                {(['pending', 'completed', 'failed'] as Order['paymentStatus'][]).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdatePaymentStatus(status)}
                    disabled={updating || order.paymentStatus === status}
                    className={`w-full px-4 py-3 rounded-lg font-semibold capitalize transition ${
                      order.paymentStatus === status
                        ? getPaymentStatusColor(status) + ' border-2'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {status}
                    {order.paymentStatus === status && ' ✓'}
                  </button>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({order.items.length} items)</span>
                  <span>₹{order.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Delivery Charges</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-purple-600">₹{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}
