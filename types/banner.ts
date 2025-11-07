export interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string;
  link?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
