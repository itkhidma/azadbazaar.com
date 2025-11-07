'use client';

import { useRouter } from 'next/navigation';

interface CartSummaryProps {
  totalAmount: number;
  totalItems: number;
  onCheckout?: () => void;
  loading?: boolean;
}

export default function CartSummary({ totalAmount, totalItems, onCheckout, loading }: CartSummaryProps) {
  const router = useRouter();
  
  // Calculate estimated tax (18% GST)
  const tax = totalAmount * 0.18;
  
  // Shipping calculation
  const shippingFee = totalAmount > 500 ? 0 : 50;
  
  // Final total
  const finalTotal = totalAmount + tax + shippingFee;

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    } else {
      router.push('/shop/checkout');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

      {/* Items Count */}
      <div className="flex justify-between text-gray-700 mb-3">
        <span>Items ({totalItems})</span>
        <span className="font-semibold">₹{totalAmount.toLocaleString()}</span>
      </div>

      {/* Shipping */}
      <div className="flex justify-between text-gray-700 mb-3">
        <span>Shipping</span>
        <span className="font-semibold">
          {shippingFee === 0 ? (
            <span className="text-green-600">FREE</span>
          ) : (
            `₹${shippingFee}`
          )}
        </span>
      </div>

      {/* Free Shipping Progress */}
      {shippingFee > 0 && totalAmount < 500 && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 mb-1">
            Add ₹{(500 - totalAmount).toFixed(0)} more for FREE shipping!
          </p>
          <div className="w-full bg-blue-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${(totalAmount / 500) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Tax */}
      <div className="flex justify-between text-gray-700 mb-3">
        <span>Tax (GST 18%)</span>
        <span className="font-semibold">₹{tax.toFixed(2)}</span>
      </div>

      <hr className="my-4" />

      {/* Total */}
      <div className="flex justify-between text-lg font-bold text-gray-900 mb-6">
        <span>Total</span>
        <span className="text-purple-600">₹{finalTotal.toLocaleString()}</span>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={loading || totalItems === 0}
        className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Proceed to Checkout'}
      </button>

      {/* Continue Shopping */}
      <button
        onClick={() => router.push('/shop/products')}
        className="w-full mt-3 bg-white text-purple-600 py-3 rounded-lg font-semibold border-2 border-purple-600 hover:bg-purple-50 transition"
      >
        Continue Shopping
      </button>

      {/* Security Badge */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Secure Checkout</span>
        </div>
      </div>
    </div>
  );
}
