import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/types";

export interface CartItem {
  product: Product;
  sizeMl: number;
  quantity: number;
  unitPrice: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  addItem: (product: Product, sizeMl?: number, unitPrice?: number, quantity?: number) => void;
  updateQuantity: (productId: string, sizeMl: number, quantity: number) => void;
  removeItem: (productId: string, sizeMl: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const STORAGE_KEY = "make-my-perfume-cart";
const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as CartItem[]; } catch { return []; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    isOpen,
    addItem: (product, sizeMl = product.size_ml, unitPrice = product.price, quantity = 1) => setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id && item.sizeMl === sizeMl);
      if (existing) return current.map((item) => item === existing ? { ...item, quantity: item.quantity + quantity } : item);
      return [...current, { product, sizeMl, unitPrice, quantity }];
    }),
    updateQuantity: (productId, sizeMl, quantity) => setItems((current) => current.map((item) => item.product.id === productId && item.sizeMl === sizeMl ? { ...item, quantity: Math.max(1, quantity) } : item)),
    removeItem: (productId, sizeMl) => setItems((current) => current.filter((item) => !(item.product.id === productId && item.sizeMl === sizeMl))),
    clearCart: () => setItems([]),
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
  }), [isOpen, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
