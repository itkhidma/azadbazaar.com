'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import CheckoutStepper from '@/components/checkout/CheckoutStepper';
import AddressSelection, { AddressFormData } from '@/components/checkout/AddressSelection';
import Link from 'next/link';
import Image from 'next/image';
import { createOrder } from '@/services/orderService';
import { updateUserProfile } from '@/services/authService';
import { Address, UserAddress } from '@/types/user';
import { updateCartItemQuantity, removeFromCart } from '@/services/cartService';
import { 
  getUserAddresses, 
  addUserAddress, 
  updateUserAddress, 
  deleteUserAddress,
  markAddressAsUsed 
} from '@/services/addressService';
import { isUserBlocked } from '@/services/customerService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Steps configuration
const CHECKOUT_STEPS = [
  {
    number: 1,
    title: 'Cart Review',
    description: 'Review your items',
  },
  {
    number: 2,
    title: 'Shipping & Payment',
    description: 'Address and payment',
  },
  {
    number: 3,
    title: 'Review Order',
    description: 'Confirm and place order',
  },
];

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, refreshCart } = useCart();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [checkingBlockStatus, setCheckingBlockStatus] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [orderAmount, setOrderAmount] = useState(0);
  const [orderItemsCount, setOrderItemsCount] = useState(0);

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod, card, upi, netbanking

  // Compute selected address from ID
  const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);

  // Load saved addresses when user is available
  useEffect(() => {
    if (user) {
      loadSavedAddresses();
      checkUserBlockStatus();
    }
  }, [user]);

  const checkUserBlockStatus = async () => {
    if (!user) return;
    
    try {
      setCheckingBlockStatus(true);
      const blocked = await isUserBlocked(user.uid);
      setIsBlocked(blocked);
    } catch (error) {
      // Silently handle
    } finally {
      setCheckingBlockStatus(false);
    }
  };

  const loadSavedAddresses = async () => {
    if (!user) return;
    
    try {
      const addresses = await getUserAddresses(user.uid);
      setSavedAddresses(addresses);
      
      // Auto-select the default or first address
      if (addresses.length > 0) {
        const defaultAddr = addresses.find(addr => addr.isDefault) || addresses[0];
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (error) {
      // Silently handle - blocked users will see empty addresses and blocked screen
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/shop/checkout');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      refreshCart();
    }
  }, [user]);

  const handleNextStep = () => {
    if (currentStep < 3) {
      // Validate before moving to next step
      if (currentStep === 2) {
        // Check if address is selected
        if (!selectedAddressId) {
          alert('Please select or add a delivery address');
          return;
        }
      }
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateCartItemQuantity(user.uid, productId, quantity);
      await refreshCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    if (!user) return;
    
    if (!confirm('Remove this item from cart?')) return;
    
    setLoading(true);
    try {
      await removeFromCart(user.uid, productId);
      await refreshCart();
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item');
    } finally {
      setLoading(false);
    }
  };

  const validateAddressForm = (formData: AddressFormData) => {
    const { fullName, phone, pincode, addressLine1, city, state } = formData;
    // addressLine2 and landmark are optional
    if (!fullName || !phone || !pincode || !addressLine1 || !city || !state) {
      alert('Please fill in all required fields');
      return false;
    }
    if (phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return false;
    }
    if (pincode.length !== 6) {
      alert('Please enter a valid 6-digit pincode');
      return false;
    }
    return true;
  };

  const handleSaveNewAddress = async (formData: AddressFormData) => {
    if (!user) return;
    if (!validateAddressForm(formData)) return;
    
    setLoading(true);
    try {
      const addressId = await addUserAddress(user.uid, {
        ...formData,
        country: 'India',
      });
      
      await loadSavedAddresses();
      setSelectedAddressId(addressId);
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAddress = async (addressId: string, formData: AddressFormData) => {
    if (!user) return;
    if (!validateAddressForm(formData)) return;
    
    setLoading(true);
    try {
      await updateUserAddress(user.uid, addressId, formData);
      await loadSavedAddresses();
    } catch (error) {
      console.error('Error updating address:', error);
      alert('Failed to update address');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return;
    if (!confirm('Delete this address?')) return;
    
    setLoading(true);
    try {
      await deleteUserAddress(user.uid, addressId);
      await loadSavedAddresses();
      if (selectedAddressId === addressId) {
        setSelectedAddressId(null);
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || !cart) return;
    
    // Check if user is blocked
    if (isBlocked) {
      alert('Your account has been blocked. You cannot place orders at this time. Please contact support.');
      return;
    }
    
    // Check if address is selected
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }
    
    setLoading(true);
    try {
      // Double-check block status before placing order
      const blocked = await isUserBlocked(user.uid);
      if (blocked) {
        alert('Your account has been blocked. You cannot place orders at this time. Please contact support.');
        setIsBlocked(true);
        setLoading(false);
        return;
      }

      // Convert UserAddress to Address type for order
      const addressData: Address = {
        street: `${selectedAddress.addressLine1}${selectedAddress.addressLine2 ? ', ' + selectedAddress.addressLine2 : ''}`,
        district: selectedAddress.city,
        landmark: selectedAddress.landmark || '',
        city: selectedAddress.city,
        state: selectedAddress.state,
        zipCode: selectedAddress.pincode,
        country: selectedAddress.country,
      };

      // Save order details before clearing cart
      setOrderAmount(cart.totalAmount);
      setOrderItemsCount(cart.totalItems);

      // Create the order
      const newOrderId = await createOrder(
        user.uid,
        cart.items,
        cart.totalAmount,
        addressData
      );

      // Mark address as last used
      await markAddressAsUsed(user.uid, selectedAddress.id);

      // The cart is automatically cleared by createOrder service
      // Refresh cart context to update UI
      await refreshCart();
      
      // Show success screen
      setOrderId(newOrderId);
      setOrderSuccess(true);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingBlockStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!user || !cart) {
    return null;
  }

  // Show order success screen
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed
            </h1>
            <p className="text-gray-600">
              Thank you for your purchase!
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            {/* Order ID */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Order ID</p>
              <p className="text-lg font-mono font-semibold text-gray-900 break-all">
                {orderId}
              </p>
            </div>

            {/* Order Summary */}
            <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-semibold text-gray-900">
                    ₹{orderAmount.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Items</span>
                  <span className="font-semibold text-gray-900">
                    {orderItemsCount} item{orderItemsCount > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Delivery Address */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Delivery Address</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{selectedAddress?.fullName}</p>
                <p>{selectedAddress?.addressLine1}</p>
                {selectedAddress?.addressLine2 && <p>{selectedAddress.addressLine2}</p>}
                <p>{selectedAddress?.city}, {selectedAddress?.state} - {selectedAddress?.pincode}</p>
                <p className="text-gray-500">{selectedAddress?.phone}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/shop/products')}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              Continue Shopping
            </button>
            
            <button
              onClick={() => router.push('/shop/orders')}
              className="w-full px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              View All Orders
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition"
            >
              Back to Home
            </button>
          </div>

          {/* Email Notice */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              📧 Order confirmation sent to your email
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show blocked message
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Blocked</h2>
            <p className="text-gray-600 mb-6">
              Your account has been blocked and you cannot place orders at this time. 
              Please contact our support team for assistance.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/shop/products"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Browse Products
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stepper */}
      <CheckoutStepper currentStep={currentStep} steps={CHECKOUT_STEPS} />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Step 1: Cart Review */}
              {currentStep === 1 && (
                <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Review Your Items
                  </h2>
                  
                  {/* Empty Cart State */}
                  {cart.items.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🛒</div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                        Your cart is empty
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Looks like you haven't added any items to your cart yet
                      </p>
                      <Link
                        href="/shop/products"
                        className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                      >
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-purple-200 transition"
                      >
                        <Link href={`/shop/products/${item.productId}`} className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.product.imageUrls[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/shop/products/${item.productId}`}>
                            <h3 className="font-semibold text-gray-900 hover:text-purple-600 transition">
                              {item.product.name}
                            </h3>
                          </Link>
                          <p className="text-lg font-bold text-purple-600 mt-1">
                            ₹{item.product.price}
                          </p>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                                disabled={item.quantity <= 1 || loading}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                −
                              </button>
                              <span className="text-black px-4 py-1 border-x border-gray-300 min-w-[3rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= item.product.stock || loading}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.productId)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-700 text-sm font-semibold disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-2">
                            Subtotal: ₹{item.product.price * item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}

                  {/* Action Buttons - Only show if cart has items */}
                  {cart.items.length > 0 && (
                    <div className="mt-6 flex gap-4">
                      <Link
                        href="/shop/products"
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition text-center"
                      >
                        Continue Shopping
                      </Link>
                      <button
                        onClick={handleNextStep}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                      >
                        Continue to Shipping
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Shipping & Payment */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Address Selection */}
                  <AddressSelection
                    savedAddresses={savedAddresses}
                    selectedAddressId={selectedAddressId}
                    onSelectAddress={setSelectedAddressId}
                    onSaveNewAddress={handleSaveNewAddress}
                    onUpdateAddress={handleUpdateAddress}
                    onDeleteAddress={handleDeleteAddress}
                  />

                  {/* Payment Method */}
                  <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Payment Method
                    </h2>
                    
                    <div className="space-y-3">
                      <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 transition">
                        <input
                          type="radio"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💰</span>
                          <div>
                            <div className="font-semibold text-gray-900">Cash on Delivery</div>
                            <div className="text-sm text-gray-600">Pay when you receive</div>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 transition opacity-50">
                        <input
                          type="radio"
                          value="card"
                          disabled
                          className="mr-3"
                        />
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💳</span>
                          <div>
                            <div className="font-semibold text-gray-900">Credit/Debit Card</div>
                            <div className="text-sm text-gray-600">Coming Soon</div>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 transition opacity-50">
                        <input
                          type="radio"
                          value="upi"
                          disabled
                          className="mr-3"
                        />
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📱</span>
                          <div>
                            <div className="font-semibold text-gray-900">UPI</div>
                            <div className="text-sm text-gray-600">Coming Soon</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handlePreviousStep}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition"
                    >
                      Back to Cart
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                    >
                      Review Order
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Order Review */}
              {currentStep === 3 && (
                <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Review Your Order
                  </h2>

                  {/* Order Items */}
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-4">Order Items</h3>
                    <div className="space-y-3">
                      {cart.items.map((item) => (
                        <div
                          key={item.productId}
                          className="flex gap-4 p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={item.product.imageUrls[0]}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">
                              {item.product.name}
                            </h4>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-purple-600">
                              ₹{item.product.price * item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900">Shipping Address</h3>
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="text-purple-600 text-sm font-semibold hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    {selectedAddress ? (
                      <>
                        <p className="text-gray-700">
                          <strong>{selectedAddress.fullName}</strong>
                        </p>
                        <p className="text-gray-700">{selectedAddress.phone}</p>
                        <p className="text-gray-700 mt-1">
                          {selectedAddress.addressLine1}
                          {selectedAddress.addressLine2 && `, ${selectedAddress.addressLine2}`}
                        </p>
                        {selectedAddress.landmark && (
                          <p className="text-gray-600 text-sm">
                            Landmark: {selectedAddress.landmark}
                          </p>
                        )}
                        <p className="text-gray-700">
                          {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          {selectedAddress.country || 'India'}
                        </p>
                      </>
                    ) : (
                      <p className="text-red-500">No address selected</p>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">Payment Method</h3>
                        <p className="text-gray-700">
                          {paymentMethod === 'cod' && '💰 Cash on Delivery'}
                          {paymentMethod === 'card' && '💳 Credit/Debit Card'}
                          {paymentMethod === 'upi' && '📱 UPI'}
                        </p>
                      </div>
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="text-purple-600 text-sm font-semibold hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" className="mt-1" required />
                      <span className="text-sm text-gray-700">
                        I agree to the{' '}
                        <Link href="/terms" className="text-purple-600 hover:underline">
                          Terms and Conditions
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-purple-600 hover:underline">
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handlePreviousStep}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Place Order</span>
                          <span className="font-bold">₹{cart.totalAmount}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Order Summary
                </h3>
                
                {cart.items.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🛒</div>
                    <p className="text-gray-500 text-sm">No items in cart</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal ({cart.totalItems} items)</span>
                        <span className="font-semibold">₹{cart.totalAmount}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Delivery Charges</span>
                        <span className="font-semibold text-green-600">FREE</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Tax (GST)</span>
                        <span className="font-semibold">₹0</span>
                      </div>
                      <hr className="my-3" />
                      <div className="flex justify-between text-lg font-bold text-gray-900">
                        <span>Total</span>
                        <span className="text-purple-600">₹{cart.totalAmount}</span>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-green-700 font-semibold flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        You're saving on delivery!
                      </p>
                    </div>

                    {currentStep === 2 && selectedAddress && selectedAddress.pincode.length === 6 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-700 font-semibold">
                          📦 Estimated Delivery
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          3-5 business days
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

