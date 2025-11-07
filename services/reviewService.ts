import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Review, ReviewSummary } from '@/types';

const reviewsCollection = collection(db, 'reviews');

// Get all reviews for a product
export const getProductReviews = async (
  productId: string,
  sortBy: 'recent' | 'helpful' | 'rating' = 'recent'
): Promise<Review[]> => {
  try {
    let q;
    
    switch (sortBy) {
      case 'helpful':
        q = query(
          reviewsCollection,
          where('productId', '==', productId),
          where('status', '==', 'approved'),
          orderBy('helpfulCount', 'desc'),
          orderBy('createdAt', 'desc')
        );
        break;
      case 'rating':
        q = query(
          reviewsCollection,
          where('productId', '==', productId),
          where('status', '==', 'approved'),
          orderBy('rating', 'desc'),
          orderBy('createdAt', 'desc')
        );
        break;
      default: // recent
        q = query(
          reviewsCollection,
          where('productId', '==', productId),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        );
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
    })) as Review[];
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    // If compound index doesn't exist, fall back to basic query
    const q = query(
      reviewsCollection,
      where('productId', '==', productId),
      where('status', '==', 'approved')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
    })) as Review[];
  }
};

// Get review summary for a product
export const getReviewSummary = async (productId: string): Promise<ReviewSummary> => {
  try {
    const q = query(
      reviewsCollection,
      where('productId', '==', productId),
      where('status', '==', 'approved')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
    
    const reviews = snapshot.docs.map(doc => doc.data() as Review);
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;
    
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });
    
    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Add new review
export const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'helpfulBy'>): Promise<string> => {
  try {
    // Remove undefined fields to avoid Firestore errors
    const cleanData: any = {
      productId: reviewData.productId,
      userId: reviewData.userId,
      userName: reviewData.userName,
      userEmail: reviewData.userEmail,
      rating: reviewData.rating,
      comment: reviewData.comment,
      isVerifiedPurchase: reviewData.isVerifiedPurchase,
      status: reviewData.status,
      helpfulCount: 0,
      helpfulBy: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add optional fields if they have values
    if (reviewData.title) {
      cleanData.title = reviewData.title;
    }
    if (reviewData.images && reviewData.images.length > 0) {
      cleanData.images = reviewData.images;
    }

    const docRef = await addDoc(reviewsCollection, cleanData);
    
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Update review
export const updateReview = async (
  id: string,
  reviewData: Partial<Pick<Review, 'rating' | 'title' | 'comment' | 'images'>>
): Promise<void> => {
  try {
    const docRef = doc(db, 'reviews', id);
    await updateDoc(docRef, {
      ...reviewData,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Delete review
export const deleteReview = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'reviews', id));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Mark review as helpful
export const markReviewHelpful = async (reviewId: string, userId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'reviews', reviewId);
    const reviewDoc = await getDoc(docRef);
    
    if (!reviewDoc.exists()) {
      throw new Error('Review not found');
    }
    
    const helpfulBy = reviewDoc.data().helpfulBy || [];
    
    if (helpfulBy.includes(userId)) {
      // User already marked as helpful, so unmark it
      await updateDoc(docRef, {
        helpfulCount: increment(-1),
        helpfulBy: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Mark as helpful
      await updateDoc(docRef, {
        helpfulCount: increment(1),
        helpfulBy: arrayUnion(userId),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get user's review for a product
export const getUserReviewForProduct = async (
  productId: string,
  userId: string
): Promise<Review | null> => {
  try {
    const q = query(
      reviewsCollection,
      where('productId', '==', productId),
      where('userId', '==', userId),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
    } as Review;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Helper: Check if user has purchased the product
export const hasUserPurchasedProduct = async (
  productId: string,
  userId: string
): Promise<boolean> => {
  try {
    const ordersCollection = collection(db, 'orders');
    const q = query(
      ordersCollection,
      where('userId', '==', userId),
      where('paymentStatus', '==', 'completed')
    );
    
    const snapshot = await getDocs(q);
    
    // Check if any completed order contains this product
    for (const orderDoc of snapshot.docs) {
      const order = orderDoc.data();
      const items = order.items || [];
      
      const hasPurchased = items.some((item: any) => 
        item.productId === productId || item.id === productId
      );
      
      if (hasPurchased) {
        return true;
      }
    }
    
    return false;
  } catch (error: any) {
    console.error('Error checking purchase history:', error);
    return false;
  }
};

// Check if user can review product (anyone can review, but verified status differs)
export const canUserReviewProduct = async (
  productId: string,
  userId: string
): Promise<{ canReview: boolean; isVerifiedPurchase: boolean }> => {
  try {
    // Check if user has already reviewed
    const existingReview = await getUserReviewForProduct(productId, userId);
    if (existingReview) {
      return { canReview: false, isVerifiedPurchase: false }; // Already reviewed
    }
    
    // Check if user has purchased the product
    const hasPurchased = await hasUserPurchasedProduct(productId, userId);
    
    // All authenticated users can review, but verified status depends on purchase
    return { canReview: true, isVerifiedPurchase: hasPurchased };
  } catch (error: any) {
    return { canReview: false, isVerifiedPurchase: false };
  }
};
