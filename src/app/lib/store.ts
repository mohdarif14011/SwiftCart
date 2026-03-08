
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, CartItem, Order, UserRole, User, OrderStatus } from '@/app/types';

interface AppState {
  user: User | null;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  favorites: string[];
  setUser: (user: User | null) => void;
  setProducts: (products: Product[]) => void;
  updateProduct: (product: Product) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  toggleFavorite: (productId: string) => void;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Fresh Bananas', category: 'Fruits', price: 0.99, inventory: 50, imageUrl: 'https://picsum.photos/seed/fruit1/300/300', description: 'Fresh organic bananas.', weight: 1, unit: 'kg' },
  { id: '2', name: 'Whole Milk 1L', category: 'Dairy', price: 1.49, inventory: 20, imageUrl: 'https://picsum.photos/seed/dairy1/300/300', description: 'Fresh farm whole milk.', weight: 1000, unit: 'g' },
  { id: '3', name: 'Artisan Bread', category: 'Bakery', price: 2.99, inventory: 15, imageUrl: 'https://picsum.photos/seed/bakery1/300/300', description: 'Baked fresh every morning.', weight: 400, unit: 'g' },
  { id: '4', name: 'Baby Spinach', category: 'Vegetables', price: 1.99, inventory: 30, imageUrl: 'https://picsum.photos/seed/veg1/300/300', description: 'Fresh leafy baby spinach.', weight: 200, unit: 'g' },
  { id: '5', name: 'Greek Yogurt', category: 'Dairy', price: 0.89, inventory: 40, imageUrl: 'https://picsum.photos/seed/dairy2/300/300', description: 'Creamy Greek yogurt.', weight: 150, unit: 'g' },
  { id: '6', name: 'Potato Chips', category: 'Snacks', price: 1.29, inventory: 60, imageUrl: 'https://picsum.photos/seed/snack1/300/300', description: 'Classic salted potato chips.', weight: 150, unit: 'g' },
  { id: '7', name: 'Gala Apples', category: 'Fruits', price: 0.79, inventory: 45, imageUrl: 'https://picsum.photos/seed/fruit2/300/300', description: 'Sweet and crunchy gala apples.', weight: 1, unit: 'kg' },
  { id: '8', name: 'Fresh Carrots', category: 'Vegetables', price: 1.19, inventory: 35, imageUrl: 'https://picsum.photos/seed/veg2/300/300', description: 'Orange and crunchy fresh carrots.', weight: 500, unit: 'g' },
  { id: '9', name: 'Chocolate Cookies', category: 'Snacks', price: 2.49, inventory: 25, imageUrl: 'https://picsum.photos/seed/snack2/300/300', description: 'Double chocolate chip cookies.', weight: 200, unit: 'g' },
  { id: '10', name: 'Dish Soap 500ml', category: 'Home Essentials', price: 3.49, inventory: 30, imageUrl: 'https://picsum.photos/seed/cleaning1/300/300', description: 'Tough on grease dishwashing liquid.', weight: 500, unit: 'g' },
  { id: '11', name: 'Paper Towels (2 Pack)', category: 'Home Essentials', price: 4.99, inventory: 20, imageUrl: 'https://picsum.photos/seed/cleaning2/300/300', description: 'Ultra absorbent multi-purpose paper towels.', weight: 2, unit: 'kg' },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      products: INITIAL_PRODUCTS,
      cart: [],
      orders: [],
      favorites: [],
      setUser: (user) => set({ user }),
      setProducts: (products) => set({ products }),
      updateProduct: (product) => set((state) => ({
        products: state.products.map(p => p.id === product.id ? product : p)
      })),
      addToCart: (product) => set((state) => {
        const existing = state.cart.find(i => i.productId === product.id);
        if (existing) {
          return {
            cart: state.cart.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
          };
        }
        return {
          cart: [...state.cart, { productId: product.id, name: product.name, price: product.price, quantity: 1, imageUrl: product.imageUrl, weight: product.weight, unit: product.unit }]
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
      toggleFavorite: (productId) => set((state) => ({
        favorites: state.favorites.includes(productId)
          ? state.favorites.filter(id => id !== productId)
          : [...state.favorites, productId]
      })),
    }),
    {
      name: 'swiftcart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        cart: state.cart, 
        favorites: state.favorites, 
        orders: state.orders 
      }),
    }
  )
);
