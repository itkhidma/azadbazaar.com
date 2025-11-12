'use client';

import { useEffect, useState } from 'react';
import { getAllOrders, updateOrderStatus, updatePaymentStatus } from '@/services/orderService';
import { Order } from '@/types/order';
import Link from 'next/link';
import AdminOnly from '@/components/admin/AdminOnly';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Order['orderStatus']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const allOrders = await getAllOrders();
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      alert('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['orderStatus']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders();
      setShowStatusModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newStatus: Order['paymentStatus']) => {
    try {
      await updatePaymentStatus(orderId, newStatus);
      await loadOrders();
      setShowPaymentModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
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

  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Date filter helper
  const isWithinDateRange = (orderDate: Date) => {
    const now = new Date();
    const orderDateTime = new Date(orderDate).getTime();

    switch (dateFilter) {
      case 'today':
        const todayStart = new Date(now.setHours(0, 0, 0, 0)).getTime();
        const todayEnd = new Date(now.setHours(23, 59, 59, 999)).getTime();
        return orderDateTime >= todayStart && orderDateTime <= todayEnd;
      
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
        return orderDateTime >= weekAgo;
      
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
        return orderDateTime >= monthAgo;
      
      case 'custom':
        if (!startDate || !endDate) return true;
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        return orderDateTime >= start && orderDateTime <= end;
      
      case 'all':
      default:
        return true;
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === 'all' || order.orderStatus === filter;
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shippingAddress.street.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shippingAddress.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = isWithinDateRange(order.createdAt);
    return matchesFilter && matchesSearch && matchesDate;
  });

  // Calculate profit from order items
  const calculateOrderProfit = (order: Order) => {
    return order.items.reduce((total, item) => {
      const price = item.product?.price || 0;
      const cost = item.product?.cost || 0;
      const profit = (price - cost) * item.quantity;
      return total + profit;
    }, 0);
  };

  // Stats - using filteredOrders for date-aware stats
  const stats = {
    total: filteredOrders.length,
    processing: filteredOrders.filter((o) => o.orderStatus === 'processing').length,
    shipped: filteredOrders.filter((o) => o.orderStatus === 'shipped').length,
    delivered: filteredOrders.filter((o) => o.orderStatus === 'delivered').length,
    cancelled: filteredOrders.filter((o) => o.orderStatus === 'cancelled').length,
    totalRevenue: filteredOrders
      .filter((o) => o.orderStatus !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0),
    totalProfit: filteredOrders
      .filter((o) => o.orderStatus !== 'cancelled')
      .reduce((sum, o) => sum + calculateOrderProfit(o), 0),
  };

  return (
    <AdminOnly>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-400">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-400">
            <p className="text-sm text-gray-600">Processing</p>
            <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-400">
            <p className="text-sm text-gray-600">Shipped</p>
            <p className="text-2xl font-bold text-purple-600">{stats.shipped}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-400">
            <p className="text-sm text-gray-600">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-400">
            <p className="text-sm text-gray-600">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Revenue</p>
            <p className="text-2xl font-bold text-green-700">₹{stats.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600">Profit</p>
            <p className="text-2xl font-bold text-yellow-700">₹{stats.totalProfit.toLocaleString()}</p>
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  dateFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  dateFilter === 'today'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  dateFilter === 'week'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  dateFilter === 'month'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setDateFilter('custom')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  dateFilter === 'custom'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom Range
              </button>
            </div>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-gray-600">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by order ID, address, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-black w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('processing')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'processing'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Processing
              </button>
              <button
                onClick={() => setFilter('shipped')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'shipped'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Shipped
              </button>
              <button
                onClick={() => setFilter('delivered')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'delivered'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Delivered
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Orders will appear here once customers start placing them'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{formatDate(order.createdAt)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{order.shippingAddress.street.split(',')[0]}</p>
                        <p className="text-xs text-gray-500">{order.shippingAddress.city}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{order.items.length} items</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">₹{order.totalAmount.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowPaymentModal(true);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getPaymentStatusColor(
                            order.paymentStatus
                          )} hover:opacity-80 transition`}
                        >
                          {order.paymentStatus}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowStatusModal(true);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(
                            order.orderStatus
                          )} hover:opacity-80 transition`}
                        >
                          {order.orderStatus}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/orders/${order.id}/edit`}
                          className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Order Status Modal */}
        {showStatusModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Update Order Status</h3>
              <p className="text-sm text-gray-600 mb-4">
                Order: #{selectedOrder.id.slice(-8).toUpperCase()}
              </p>
              <div className="space-y-2 mb-6">
                {(['processing', 'shipped', 'delivered', 'cancelled'] as Order['orderStatus'][]).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, status)}
                    className={`w-full px-4 py-3 rounded-lg font-semibold capitalize transition ${
                      selectedOrder.orderStatus === status
                        ? getStatusColor(status) + ' ring-2 ring-purple-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedOrder(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Payment Status Modal */}
        {showPaymentModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Update Payment Status</h3>
              <p className="text-sm text-gray-600 mb-4">
                Order: #{selectedOrder.id.slice(-8).toUpperCase()}
              </p>
              <div className="space-y-2 mb-6">
                {(['pending', 'completed', 'failed'] as Order['paymentStatus'][]).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdatePaymentStatus(selectedOrder.id, status)}
                    className={`w-full px-4 py-3 rounded-lg font-semibold capitalize transition ${
                      selectedOrder.paymentStatus === status
                        ? getPaymentStatusColor(status) + ' ring-2 ring-purple-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedOrder(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminOnly>
  );
}
