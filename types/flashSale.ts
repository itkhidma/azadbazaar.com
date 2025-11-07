export interface FlashSale {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  originalPrice: number;
  salePrice: number;
  discountPercentage: number;
  startDate: Date;
  endDate: Date;
  stockLimit: number; // Limited stock for flash sale
  soldCount: number; // How many sold so far
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
