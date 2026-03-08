
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, CartItem, Order, User } from '@/app/types';

interface AppState {
  user: User | null;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  favorites: string[];
  searchQuery: string;
  setUser: (user: User | null) => void;
  setProducts: (products: Product[]) => void;
  setSearchQuery: (query: string) => void;
  updateProduct: (product: Product) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (order: Order) => void;
  toggleFavorite: (productId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      products: [],
      cart: [],
      orders: [],
      favorites: [],
      searchQuery: '',
      setUser: (user) => set({ user }),
      setProducts: (products) => set({ products }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
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
      toggleFavorite: (productId) => set((state) => ({
        favorites: state.favorites.includes(productId)
          ? state.favorites.filter(id => id !== productId)
          : [...state.favorites, productId]
      })),
    }),
    {
      name: 'swiftcart-storage-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        cart: state.cart, 
        favorites: state.favorites, 
        orders: state.orders 
      }),
    }
  )
);
