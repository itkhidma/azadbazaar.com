'use client';

import { useState } from 'react';
import { UserAddress } from '@/types/user';

export interface AddressFormData {
  label: string;
  fullName: string;
  phone: string;
  pincode: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  isDefault: boolean;
}

interface AddressSelectionProps {
  savedAddresses: UserAddress[];
  selectedAddressId: string | null;
  onSelectAddress: (addressId: string) => void;
  onSaveNewAddress: (formData: AddressFormData) => Promise<void>;
  onUpdateAddress: (addressId: string, formData: AddressFormData) => Promise<void>;
  onDeleteAddress: (addressId: string) => Promise<void>;
  loading?: boolean;
}

export default function AddressSelection({
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  onSaveNewAddress,
  onUpdateAddress,
  onDeleteAddress,
  loading = false,
}: AddressSelectionProps) {
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(savedAddresses.length === 0);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  
  const [formData, setFormData] = useState<AddressFormData>({
    label: 'Home',
    fullName: '',
    phone: '',
    pincode: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    isDefault: false,
  });

  const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);

  const handleEditClick = (address: UserAddress) => {
    setEditingAddressId(address.id);
    
    // Check if the label is a predefined one or custom
    const isPredefinedLabel = ['Home', 'Office'].includes(address.label);
    
    setFormData({
      label: isPredefinedLabel ? address.label : 'Other',
      fullName: address.fullName,
      phone: address.phone,
      pincode: address.pincode,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      landmark: address.landmark || '',
      city: address.city,
      state: address.state,
      isDefault: address.isDefault,
    });
    
    // Set custom label if it's not a predefined one
    setCustomLabel(isPredefinedLabel ? '' : address.label);
    
    setShowNewAddressForm(true);
  };

  const handleSaveClick = async () => {
    // Use custom label if "Other" is selected
    const finalFormData = {
      ...formData,
      label: formData.label === 'Other' && customLabel ? customLabel : formData.label,
    };
    
    if (editingAddressId) {
      await onUpdateAddress(editingAddressId, finalFormData);
      setEditingAddressId(null);
    } else {
      await onSaveNewAddress(finalFormData);
    }
    setShowNewAddressForm(false);
    setCustomLabel('');
    setFormData({
      label: 'Home',
      fullName: '',
      phone: '',
      pincode: '',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      city: '',
      state: '',
      isDefault: false,
    });
  };

  const handleCancelEdit = () => {
    setEditingAddressId(null);
    setShowNewAddressForm(false);
    setFormData({
      label: 'Home',
      fullName: '',
      phone: '',
      pincode: '',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      city: '',
      state: '',
      isDefault: false,
    });
  };

  // If there are saved addresses and not showing selector/form, show collapsed view
  if (savedAddresses.length > 0 && !showAddressSelector && !showNewAddressForm) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Deliver To</h2>
          <button
            onClick={() => setShowAddressSelector(true)}
            className="text-purple-600 font-semibold hover:underline text-sm"
          >
            Change
          </button>
        </div>

        {selectedAddress && (
          <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900">{selectedAddress.label}</span>
                  {selectedAddress.isDefault && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-gray-900 font-semibold">{selectedAddress.fullName}</p>
                <p className="text-gray-700">{selectedAddress.phone}</p>
                <p className="text-gray-700 mt-1">
                  {selectedAddress.addressLine1}
                  {selectedAddress.addressLine2 && `, ${selectedAddress.addressLine2}`}
                </p>
                {selectedAddress.landmark && (
                  <p className="text-gray-600 text-sm">Landmark: {selectedAddress.landmark}</p>
                )}
                <p className="text-gray-700">
                  {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowNewAddressForm(true)}
          className="mt-4 w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-purple-400 hover:text-purple-600 transition"
        >
          + Deliver to Different Address
        </button>
      </div>
    );
  }

  // Show address selector or new address form
  return (
    <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {showNewAddressForm ? (editingAddressId ? 'Edit Address' : 'Add New Address') : 'Select Delivery Address'}
      </h2>

      {/* Address Selector */}
      {!showNewAddressForm && (
        <>
          <div className="space-y-3 mb-6">
            {savedAddresses.map((address) => (
              <label
                key={address.id}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                  selectedAddressId === address.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddressId === address.id}
                  onChange={() => onSelectAddress(address.id)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{address.label}</span>
                    {address.isDefault && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 font-semibold">{address.fullName}</p>
                  <p className="text-gray-600 text-sm">{address.phone}</p>
                  <p className="text-gray-700 mt-1">
                    {address.addressLine1}
                    {address.addressLine2 && `, ${address.addressLine2}`}
                  </p>
                  {address.landmark && (
                    <p className="text-gray-600 text-sm">Landmark: {address.landmark}</p>
                  )}
                  <p className="text-gray-700">
                    {address.city}, {address.state} - {address.pincode}
                  </p>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => handleEditClick(address)}
                      className="text-purple-600 text-sm font-semibold hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteAddress(address.id)}
                      disabled={loading}
                      className="text-red-600 text-sm font-semibold hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={() => setShowNewAddressForm(true)}
            className="text-black w-full px-4 py-3 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-purple-400 hover:text-purple-600 transition"
          >
            + Add New Address
          </button>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setShowAddressSelector(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {/* New/Edit Address Form */}
      {showNewAddressForm && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address Label <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {['Home', 'Office', 'Other'].map((label) => (
                <button
                  key={label}
                  onClick={() => setFormData({ ...formData, label })}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    formData.label === label
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {formData.label === 'Other' && (
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Enter custom label (e.g., Parent's Home, Friend's Place)"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="9876543210"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="110001"
                maxLength={6}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="House No., Building Name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Road Name, Area, Colony"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Landmark
              </label>
              <input
                type="text"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Near Railway Station"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="New Delhi"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Delhi"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-gray-700">Set as default address</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleCancelEdit}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClick}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save Address'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
