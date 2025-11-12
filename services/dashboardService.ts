import { 
  collection, 
  query, 
  getDocs,
  getDoc,
  doc,
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
    
    // Fetch user names for each order
    const ordersWithNames = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let customerName = 'Guest';
        
        // Fetch user name from users collection
        if (data.userId) {
          try {
            const userDoc = await getDocs(
              query(collection(db, 'users'), where('uid', '==', data.userId), limit(1))
            );
            
            if (!userDoc.empty) {
              const userData = userDoc.docs[0].data();
              customerName = userData.displayName || userData.email || 'Guest';
            }
          } catch (error) {
            console.error('Error fetching user name:', error);
          }
        }
        
        return {
          id: doc.id,
          customerName,
          amount: data.totalAmount || 0,
          status: data.orderStatus || 'processing',
          date: (data.createdAt as Timestamp).toDate(),
        };
      })
    );
    
    return ordersWithNames;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get top selling products
export const getTopProducts = async (limitCount: number = 5): Promise<TopProduct[]> => {
  try {
    // Get all orders to calculate product sales
    const ordersQuery = query(collection(db, 'orders'));
    const ordersSnapshot = await getDocs(ordersQuery);
    
    // Map to track product sales: productId -> { sales count, revenue }
    const productSalesMap = new Map<string, { sales: number; revenue: number }>();
    
    ordersSnapshot.forEach((doc) => {
      const order = doc.data();
      const items = order.items || [];
      
      items.forEach((item: any) => {
        const productId = item.productId || item.id;
        const quantity = item.quantity || 0;
        // Get price from item or from nested product object
        const price = item.price || item.product?.price || 0;
        const revenue = quantity * price;
        
        if (productSalesMap.has(productId)) {
          const existing = productSalesMap.get(productId)!;
          existing.sales += quantity;
          existing.revenue += revenue;
        } else {
          productSalesMap.set(productId, {
            sales: quantity,
            revenue: revenue,
          });
        }
      });
    });
    
    // Convert map to array and sort by sales count
    const sortedProductIds = Array.from(productSalesMap.entries())
      .sort((a, b) => b[1].sales - a[1].sales)
      .slice(0, limitCount);
    
    // Fetch product names from products collection
    const productsWithNames = await Promise.all(
      sortedProductIds.map(async ([productId, data]) => {
        let productName = 'Unknown Product';
        
        try {
          const productDoc = await getDoc(doc(db, 'products', productId));
          if (productDoc.exists()) {
            productName = productDoc.data().name || 'Unknown Product';
          }
        } catch (error) {
          console.error('Error fetching product name:', error);
        }
        
        return {
          id: productId,
          name: productName,
          sales: data.sales,
          revenue: Math.round(data.revenue),
        };
      })
    );
    
    return productsWithNames;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
