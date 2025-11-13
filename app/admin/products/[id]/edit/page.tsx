'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProductById, updateProduct, deleteProduct } from '@/services/productService';
import { getAllCategories } from '@/services/categoryService';
import { uploadToCloudinary, uploadVideoToCloudinary } from '@/lib/cloudinary';
import { Product, Category } from '@/types';
import Image from 'next/image';
import RichTextEditor from '@/components/common/RichTextEditor';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    category: '',
  });
  
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string>('');
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [newVideoPreview, setNewVideoPreview] = useState<string>('');
  const [removeVideo, setRemoveVideo] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadCategories();
    loadProduct();
  }, [productId]);

  const loadCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadProduct = async () => {
    try {
      const product = await getProductById(productId);
      if (product) {
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          cost: product.cost?.toString() || '',
          stock: product.stock.toString(),
          category: typeof product.category === 'string' ? product.category : product.category.id,
        });
        setExistingImages(product.imageUrls || []);
        setExistingVideoUrl(product.videoUrl || '');
      }
    } catch (error) {
      setError('Failed to load product');
    } finally {
      setFetchingProduct(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDescriptionChange = (html: string) => {
    setFormData({
      ...formData,
      description: html,
    });
  };

  const handleNewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + existingImages.length + newImageFiles.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    setNewImageFiles([...newImageFiles, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setNewImagePreviews([...newImagePreviews, ...newPreviews]);
    setError('');
  };

  const handleNewImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    
    if (files.length + existingImages.length + newImageFiles.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    setNewImageFiles([...newImageFiles, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setNewImagePreviews([...newImagePreviews, ...newPreviews]);
    setError('');
  };

  const handleImageDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeExistingImage = (index: number) => {
    const newImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(newImages);
  };

  const removeNewImage = (index: number) => {
    const newFiles = newImageFiles.filter((_, i) => i !== index);
    const newPreviews = newImagePreviews.filter((_, i) => i !== index);
    setNewImageFiles(newFiles);
    setNewImagePreviews(newPreviews);
  };

  // Drag and Drop for existing images (reordering)
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...existingImages];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setExistingImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleNewVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    // Validate file size (e.g., max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Video file size must be less than 50MB');
      return;
    }

    setNewVideoFile(file);
    setNewVideoPreview(URL.createObjectURL(file));
    setRemoveVideo(false);
    setError('');
  };

  const handleNewVideoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    // Validate file size (e.g., max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Video file size must be less than 50MB');
      return;
    }

    setNewVideoFile(file);
    setNewVideoPreview(URL.createObjectURL(file));
    setRemoveVideo(false);
    setError('');
  };

  const handleRemoveVideo = () => {
    if (newVideoFile) {
      // Remove newly selected video
      setNewVideoFile(null);
      setNewVideoPreview('');
    } else {
      // Mark existing video for removal
      setRemoveVideo(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    if (existingImages.length === 0 && newImageFiles.length === 0) {
      setError('Please have at least one product image');
      return;
    }

    setLoading(true);

    try {
      // Upload new images to Cloudinary
      let newImageUrls: string[] = [];
      if (newImageFiles.length > 0) {
        setUploadingImages(true);
        newImageUrls = await Promise.all(
          newImageFiles.map(file => uploadToCloudinary(file))
        );
        setUploadingImages(false);
      }

      // Combine existing and new image URLs
      const allImageUrls = [...existingImages, ...newImageUrls];

      // Handle video upload
      let finalVideoUrl: string | undefined = existingVideoUrl;
      if (newVideoFile) {
        setUploadingVideo(true);
        finalVideoUrl = await uploadVideoToCloudinary(newVideoFile);
        setUploadingVideo(false);
      } else if (removeVideo) {
        finalVideoUrl = undefined;
      }

      // Prepare product data
      const productData: any = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost) || 0,
        stock: formData.stock ? parseInt(formData.stock) : 1,
        category: formData.category,
        imageUrls: allImageUrls,
      };

      // Only add videoUrl if it exists (not undefined)
      if (finalVideoUrl) {
        productData.videoUrl = finalVideoUrl;
      }

      // Update product in Firestore
      await updateProduct(productId, productData);
      
      // Redirect to products list
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
      setLoading(false);
      setUploadingImages(false);
      setUploadingVideo(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteProduct(productId);
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
      setLoading(false);
    }
  };

  if (fetchingProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600 mt-1">Update product details and images</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Product Images */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product Images <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Drag to reorder. Drag & drop or click to add new images. First image will be the main image. Maximum 5 images.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            {/* Existing Images */}
            {existingImages.map((imageUrl, index) => (
              <div
                key={`existing-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group cursor-move ${draggedIndex === index ? 'opacity-50' : ''}`}
              >
                <Image
                  src={imageUrl}
                  alt={`Product ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 hover:border-orange-400"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {index === 0 && (
                  <span className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                    Main
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black bg-opacity-20 rounded-lg transition">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </div>
            ))}

            {/* New Images Preview */}
            {newImagePreviews.map((preview, index) => (
              <div key={`new-${index}`} className="relative group">
                <Image
                  src={preview}
                  alt={`New ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-32 object-cover rounded-lg border-2 border-green-400"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
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
            ))}
            
            {/* Add More Images */}
            {existingImages.length + newImageFiles.length < 5 && (
              <div
                onDrop={handleNewImageDrop}
                onDragOver={handleImageDragOver}
              >
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs text-gray-500 mt-2">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleNewImageSelect}
                    className="text-black hidden"
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
              Product Name <span className="text-red-500">*</span>
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

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
              disabled={loadingCategories}
            >
              <option value="">
                {loadingCategories ? 'Loading categories...' : 'Select Category'}
              </option>
              {categories.map(cat => (
                <option className='text-black' key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Stock Quantity
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Selling Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cost Price (₹)
            </label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder="Describe your product... (You can include weight, ingredients, expiry date, or any other details here)"
          />
        </div>

        {/* Product Video */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product Video (Optional)
          </label>
          <p className="text-xs text-gray-500 mb-3">Upload a product demo or promo video (max 50MB). Drag & drop or click to browse.</p>
          
          {newVideoPreview ? (
            <div className="relative">
              <video
                src={newVideoPreview}
                controls
                className="w-full max-h-64 rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={handleRemoveVideo}
                className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition"
              >
                Remove Video
              </button>
            </div>
          ) : existingVideoUrl && !removeVideo ? (
            <div className="relative">
              <video
                src={existingVideoUrl}
                controls
                className="w-full max-h-64 rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={handleRemoveVideo}
                className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition"
              >
                Remove Video
              </button>
            </div>
          ) : (
            <div
              onDrop={handleNewVideoDrop}
              onDragOver={handleImageDragOver}
            >
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-gray-500 mt-2">Add Video</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleNewVideoSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}
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
            Delete Product
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadingImages ? 'Uploading Images...' : uploadingVideo ? 'Uploading Video...' : loading ? 'Updating...' : 'Update Product'}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Product?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
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
