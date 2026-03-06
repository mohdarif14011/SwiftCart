
import { create } from 'zustand';
import { Product, CartItem, Order, UserRole, User } from '@/app/types';

interface AppState {
  user: User | null;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  setUser: (user: User | null) => void;
  setProducts: (products: Product[]) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order.status) => void;
}

// Minimal products for initial catalog
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Organic Bananas', category: 'Fruits', price: 0.99, inventory: 50, imageUrl: 'https://picsum.photos/seed/fruit1/300/300', description: 'Fresh organic bananas from Ecuador.' },
  { id: '2', name: 'Fresh Whole Milk', category: 'Dairy', price: 3.49, inventory: 20, imageUrl: 'https://picsum.photos/seed/dairy1/300/300', description: 'Pasture-raised whole milk, 1 gallon.' },
  { id: '3', name: 'Sourdough Bread', category: 'Bakery', price: 5.99, inventory: 15, imageUrl: 'https://picsum.photos/seed/bakery1/300/300', description: 'Artisanal sourdough baked fresh daily.' },
  { id: '4', name: 'Baby Spinach', category: 'Vegetables', price: 2.99, inventory: 30, imageUrl: 'https://picsum.photos/seed/veg1/300/300', description: 'Pre-washed baby spinach leaves.' },
  { id: '5', name: 'Greek Yogurt', category: 'Dairy', price: 1.49, inventory: 40, imageUrl: 'https://picsum.photos/seed/dairy2/300/300', description: 'Plain non-fat Greek yogurt.' },
  { id: '6', name: 'Gala Apples', category: 'Fruits', price: 1.29, inventory: 60, imageUrl: 'https://picsum.photos/seed/fruit2/300/300', description: 'Sweet and crunchy Gala apples.' },
];

import { create as createZustand } from 'zustand';

export const useAppStore = createZustand<AppState>((set) => ({
  user: null,
  products: INITIAL_PRODUCTS,
  cart: [],
  orders: [],
  setUser: (user) => set({ user }),
  setProducts: (products) => set({ products }),
  addToCart: (product) => set((state) => {
    const existing = state.cart.find(i => i.productId === product.id);
    if (existing) {
      return {
        cart: state.cart.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      };
    }
    return {
      cart: [...state.cart, { productId: product.id, name: product.name, price: product.price, quantity: 1, imageUrl: product.imageUrl }]
    };
  }),
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(i => i.productId !== productId)
  })),
  updateCartQuantity: (productId, quantity) => set((state) => ({
    cart: state.cart.map(i => i.productId === productId ? { ...i, quantity: Math.max(0, quantity) } : i).filter(i => i.quantity > 0)
  })),
  clearCart: () => set({ cart: [] }),
  placeOrder: (order) => set((state) => ({
    orders: [order, ...state.orders],
    cart: []
  })),
  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
  })),
}));
