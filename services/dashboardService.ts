import { 
  collection, 
  query, 
  getDocs, 
  where,
  orderBy,
  limit,
  Timestamp,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, Product } from '@/types';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  completedOrders: number;
  lowStockProducts: number;
  revenueGrowth: number;
}

export interface RecentOrder {
  id: string;
  customerName: string;
  amount: number;
  status: string;
  date: Date;
}

export interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

// Get dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get total orders count
    const ordersSnapshot = await getCountFromServer(collection(db, 'orders'));
    const totalOrders = ordersSnapshot.data().count;

    // Get total products count
    const productsSnapshot = await getCountFromServer(collection(db, 'products'));
    const totalProducts = productsSnapshot.data().count;

    // Get total customers count
    const usersSnapshot = await getCountFromServer(
      query(collection(db, 'users'), where('role', '==', 'customer'))
    );
    const totalCustomers = usersSnapshot.data().count;

    // Get all orders to calculate revenue and status counts
    const ordersQuery = query(collection(db, 'orders'));
    const ordersData = await getDocs(ordersQuery);
    
    let totalRevenue = 0;
    let pendingOrders = 0;
    let completedOrders = 0;

    ordersData.forEach((doc) => {
      const order = doc.data();
      totalRevenue += order.totalAmount || 0;
      
      if (order.orderStatus === 'processing' || order.orderStatus === 'pending') {
        pendingOrders++;
      }
      if (order.orderStatus === 'delivered') {
        completedOrders++;
      }
    });

    // Get low stock products (stock < 10)
    const lowStockQuery = query(
      collection(db, 'products'),
      where('stock', '<', 10)
    );
    const lowStockSnapshot = await getCountFromServer(lowStockQuery);
    const lowStockProducts = lowStockSnapshot.data().count;

    // Calculate revenue growth (simplified - comparing last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrdersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    const recentOrdersData = await getDocs(recentOrdersQuery);
    
    let recentRevenue = 0;
    recentOrdersData.forEach((doc) => {
      recentRevenue += doc.data().totalAmount || 0;
    });

    const revenueGrowth = totalRevenue > 0 
      ? ((recentRevenue / totalRevenue) * 100) 
      : 0;

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      pendingOrders,
      completedOrders,
      lowStockProducts,
      revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get recent orders
export const getRecentOrders = async (limitCount: number = 5): Promise<RecentOrder[]> => {
  try {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        customerName: data.customerName || 'Guest',
        amount: data.totalAmount || 0,
        status: data.orderStatus || 'processing',
        date: (data.createdAt as Timestamp).toDate(),
      };
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get top selling products
export const getTopProducts = async (limitCount: number = 5): Promise<TopProduct[]> => {
  try {
    // Note: This is a simplified version
    // For production, you'd want to track sales count in a separate field
    const q = query(
      collection(db, 'products'),
      orderBy('stock', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        sales: 100 - (data.stock || 0), // Simplified calculation
        revenue: (100 - (data.stock || 0)) * data.price,
      };
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};
