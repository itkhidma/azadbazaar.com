import { Category } from './category';
import { FlashSale } from './flashSale';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  imageUrls: string[]; // Cloudinary URLs
  videoUrl?: string; // Optional: Cloudinary video URL
  category: Category | string; // Can be Category object or string (category ID/name)
  stock: number;
  createdBy: string; // User ID of the creator
  createdAt: Date;
  updatedAt: Date;
  flashSale?: FlashSale; // Optional: Active flash sale for this product
  salesCount?: number; // Optional: Track number of sales for best sellers
  isFeatured?: boolean; // Optional: Mark as featured/best seller
}
