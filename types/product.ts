import { Category } from './category';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; // Original price before flash sale
  cost: number;
  imageUrls: string[]; // Cloudinary URLs
  videoUrl?: string; // Optional: Cloudinary video URL
  category: Category | string; // Can be Category object or string (category ID/name)
  stock: number;
  createdBy: string; // User ID of the creator
  createdAt: Date;
  updatedAt: Date;
  // Flash sale fields (single source of truth)
  isOnFlashSale?: boolean;
  flashSaleEndDate?: Date;
  flashSaleDiscountPercentage?: number;
  flashSaleSoldCount?: number;
  flashSaleStockLimit?: number;
  // Other fields
  salesCount?: number; // Optional: Track number of sales for best sellers
  isFeatured?: boolean; // Optional: Mark as featured/best seller
}
