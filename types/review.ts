export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number; // 1-5 stars
  title?: string;
  comment: string;
  images?: string[]; // Optional review images
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  helpfulBy: string[]; // Array of user IDs who marked as helpful
  status: 'pending' | 'approved' | 'rejected'; // Moderation status
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
