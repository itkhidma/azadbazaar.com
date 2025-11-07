'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProductReviews, getReviewSummary, markReviewHelpful, canUserReviewProduct } from '@/services/reviewService';
import { Review, ReviewSummary } from '@/types';
import ReviewForm from './ReviewForm';
import Image from 'next/image';

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [isVerifiedPurchase, setIsVerifiedPurchase] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');

  useEffect(() => {
    loadReviews();
    loadSummary();
    checkCanReview();
  }, [productId, sortBy]);

  const loadReviews = async () => {
    try {
      const data = await getProductReviews(productId, sortBy);
      // Sort verified purchases first, then by the selected sort option
      const sortedData = [...data].sort((a, b) => {
        if (a.isVerifiedPurchase && !b.isVerifiedPurchase) return -1;
        if (!a.isVerifiedPurchase && b.isVerifiedPurchase) return 1;
        return 0;
      });
      setReviews(sortedData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await getReviewSummary(productId);
      setSummary(data);
    } catch (error) {
      console.error('Error loading review summary:', error);
    }
  };

  const checkCanReview = async () => {
    if (!user) {
      setCanReview(false);
      setIsVerifiedPurchase(false);
      return;
    }

    const result = await canUserReviewProduct(productId, user.uid);
    setCanReview(result.canReview);
    setIsVerifiedPurchase(result.isVerifiedPurchase);
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    loadReviews();
    loadSummary();
    checkCanReview();
  };

  const handleHelpful = async (reviewId: string) => {
    if (!user) {
      alert('Please login to mark reviews as helpful');
      return;
    }

    try {
      await markReviewHelpful(reviewId, user.uid);
      loadReviews(); // Reload to show updated counts
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'text-2xl' : 'text-lg';
    return (
      <div className={`flex ${sizeClass}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading && !summary) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="h-48 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      {summary && summary.totalReviews > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="flex flex-col items-center justify-center md:border-r border-gray-200">
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {summary.averageRating.toFixed(1)}
              </div>
              {renderStars(Math.round(summary.averageRating), 'lg')}
              <p className="text-sm text-gray-600 mt-2">
                Based on {summary.totalReviews} {summary.totalReviews === 1 ? 'review' : 'reviews'}
              </p>
              
              {/* Verified vs Community Stats */}
              <div className="flex gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-600">
                    {reviews.filter(r => r.isVerifiedPurchase).length} Verified
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-gray-600">
                    {reviews.filter(r => !r.isVerifiedPurchase).length} Community
                  </span>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = summary.ratingDistribution[rating as keyof typeof summary.ratingDistribution];
                const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-8">{rating} ★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Write Review Button / Form */}
      {!showReviewForm ? (
        <div className="flex items-center justify-between bg-purple-50 rounded-xl p-4 border border-purple-100">
          <div>
            <h3 className="font-semibold text-gray-900">Share your thoughts</h3>
            <p className="text-sm text-gray-600">Help others make informed decisions</p>
          </div>
          {canReview ? (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              Write a Review
            </button>
          ) : (
            <span className="text-sm text-gray-500">
              {user ? 'You have already reviewed this product' : 'Login to write a review'}
            </span>
          )}
        </div>
      ) : (
        <ReviewForm
          productId={productId}
          isVerifiedPurchase={isVerifiedPurchase}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Sort Options */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            Customer Reviews ({reviews.length})
          </h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating">Highest Rating</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600">Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-xl shadow-md border p-6 hover:shadow-lg transition ${
                review.isVerifiedPurchase 
                  ? 'border-green-200 bg-gradient-to-br from-white to-green-50' 
                  : 'border-gray-100'
              }`}
            >
              {/* Reviewer Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    review.isVerifiedPurchase ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    <span className={`font-bold text-lg ${
                      review.isVerifiedPurchase ? 'text-green-600' : 'text-purple-600'
                    }`}>
                      {review.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{review.userName}</h4>
                      {review.isVerifiedPurchase && (
                        <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-semibold border border-green-300">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified Purchase
                        </span>
                      )}
                      {!review.isVerifiedPurchase && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Community
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>

              {/* Review Title */}
              {review.title && (
                <h5 className="font-semibold text-gray-900 mb-2">{review.title}</h5>
              )}

              {/* Review Comment */}
              <p className="text-gray-700 mb-4">{review.comment}</p>

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {review.images.map((image, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                      <Image
                        src={image}
                        alt={`Review image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Helpful Button */}
              <button
                onClick={() => handleHelpful(review.id)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span>
                  Helpful ({review.helpfulCount})
                </span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
