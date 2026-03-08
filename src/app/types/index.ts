
export type UserRole = 'CUSTOMER' | 'ADMIN' | 'DELIVERY_AGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  inventory: number;
  imageUrl: string;
  description: string;
  weight?: number;
  unit?: 'g' | 'kg';
  offerPercentage?: number;
}

export interface DeliveryAgent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'Available' | 'On Delivery' | 'Offline';
  vehicleType?: string;
  joinedAt?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  weight?: number;
  unit?: 'g' | 'kg';
}

export type OrderStatus = 'CONFIRMED' | 'PREPARING' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  address: string;
  agentId?: string;
  agentLocation?: { lat: number; lng: number };
}
