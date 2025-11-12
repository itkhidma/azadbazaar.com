'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { updateUserProfile } from '@/services/authService';
import { uploadToCloudinary } from '@/lib/cloudinary';

type TabType = 'profile' | 'preferences';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile data
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [uploading, setUploading] = useState(false);

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }

    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user, loading, router]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      const imageUrl = await uploadToCloudinary(file);
      
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser!, {
        photoURL: imageUrl,
      });

      // Update Firestore
      await updateUserProfile(user.uid, { photoURL: imageUrl });
      
      setPhotoURL(imageUrl);
      showMessage('success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      showMessage('error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);

      // Update Firebase Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName,
        });
      }

      // Update Firestore - only include phoneNumber if it has a value
      const updateData: any = {
        displayName,
      };
      
      if (phoneNumber && phoneNumber.trim()) {
        updateData.phoneNumber = phoneNumber;
      }

      await updateUserProfile(user.uid, updateData);

      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);

      // Update preferences in Firestore
      await updateUserProfile(user.uid, {
        preferences: {
          emailNotifications,
          orderUpdates,
          promotions,
        },
      } as any);

      showMessage('success', 'Preferences updated successfully!');
    } catch (error) {
      console.error('Error updating preferences:', error);
      showMessage('error', 'Failed to update preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                    activeTab === 'profile'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                    activeTab === 'preferences'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Preferences
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6 md:p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileUpdate}>
                  {/* Profile Picture */}
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        {photoURL ? (
                          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100">
                            <Image
                              src={photoURL}
                              alt={displayName || 'User'}
                              width={96}
                              height={96}
                              className="text-black w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center border-4 border-gray-100">
                            <span className="text-purple-600 font-bold text-3xl">
                              {(displayName || email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                          </div>
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          id="photo-upload"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        <label
                          htmlFor="photo-upload"
                          className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer text-sm font-medium"
                        >
                          {uploading ? 'Uploading...' : 'Change Photo'}
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          JPG, PNG or GIF. Max size 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed
                      </p>
                    </div>

                    <div>
                      <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <form onSubmit={handlePreferencesUpdate}>
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Notification Preferences</h3>
                    <p className="text-sm text-gray-600">
                      Manage how you receive notifications and updates.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start justify-between py-4 border-b border-gray-200">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Receive email notifications for account activities
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-start justify-between py-4 border-b border-gray-200">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">Order Updates</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Get notified about order status changes and delivery updates
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={orderUpdates}
                          onChange={(e) => setOrderUpdates(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-start justify-between py-4 border-b border-gray-200">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">Promotions & Offers</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Receive promotional emails and special offers
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={promotions}
                          onChange={(e) => setPromotions(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/shop/orders')}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">My Orders</p>
                  <p className="text-xs text-gray-500">View order history</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/shop/wishlist')}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Wishlist</p>
                  <p className="text-xs text-gray-500">View saved items</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/shop/addresses')}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Addresses</p>
                  <p className="text-xs text-gray-500">Manage addresses</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
