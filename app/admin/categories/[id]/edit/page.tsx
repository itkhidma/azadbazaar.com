'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCategoryById, updateCategory, deleteCategory } from '@/services/categoryService';
import { uploadToCloudinary } from '@/lib/cloudinary';
import Image from 'next/image';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchingCategory, setFetchingCategory] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
  });

  const [existingImage, setExistingImage] = useState<string>('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string>('');

  useEffect(() => {
    loadCategory();
  }, [categoryId]);

  const loadCategory = async () => {
    try {
      const category = await getCategoryById(categoryId);
      if (category) {
        setFormData({
          name: category.name,
        });
        setExistingImage(category.imageUrl);
      }
    } catch (error) {
      setError('Failed to load category');
    } finally {
      setFetchingCategory(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // Only take the first file
    const file = files[0];
    
    setNewImageFile(file);
    
    // Create preview for single image
    const preview = URL.createObjectURL(file);
    setNewImagePreview(preview);
    setError('');
};

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    
    if (files.length === 0) return;
    
    // Only take the first file
    const file = files[0];
    
    setNewImageFile(file);
    
    // Create preview for single image
    const preview = URL.createObjectURL(file);
    setNewImagePreview(preview);
    setError('');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeNewImage = () => {
    setNewImageFile(null);
    setNewImagePreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name) {
      setError('Please fill in name of the category');
      return;
    }

    if (!existingImage && !newImageFile) {
      setError('Please have at least one category image');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = existingImage;
      
      // Upload new image if one was selected
      if (newImageFile) {
        setUploadingImage(true);
        imageUrl = await uploadToCloudinary(newImageFile);
        setUploadingImage(false);
      }

      // Prepare category data
      const categoryData = {
        name: formData.name,
        imageUrl: imageUrl,
      };

      // Update category in Firestore
      await updateCategory(categoryId, categoryData);

      // Redirect to categories list
      router.push('/admin/categories');
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteCategory(categoryId);
      router.push('/admin/categories');
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
      setLoading(false);
    }
  };

  if (fetchingCategory) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
        <p className="text-gray-600 mt-1">Update category details and images</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Category Images */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category Image <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">Upload a new image to replace the existing one (optional). Drag & drop or click to browse.</p>
          
          <div className="flex gap-4 mb-4">
            {/* Show new image preview if uploaded, otherwise show existing image */}
            {newImagePreview ? (
              <div className="relative group">
                <Image
                  src={newImagePreview}
                  alt="New Category Image"
                  width={200}
                  height={200}
                  className="w-32 h-32 object-cover rounded-lg border-2 border-green-400"
                />
                <button
                  type="button"
                  onClick={removeNewImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  New
                </span>
              </div>
            ) : existingImage ? (
              <div className="relative group">
                <Image
                  src={existingImage}
                  alt="Current Category Image"
                  width={200}
                  height={200}
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Current
                </span>
              </div>
            ) : null}
            
            {/* Upload new image button */}
            {!newImagePreview && (
              <div
                onDrop={handleImageDrop}
                onDragOver={handleDragOver}
              >
                <label className="flex flex-col items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs text-gray-500 mt-2">
                    {existingImage ? 'Change Image' : 'Add Image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            disabled={loading}
          >
            Delete Category
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadingImage ? 'Uploading Images...' : loading ? 'Updating...' : 'Update Category'}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Category?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this category? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
