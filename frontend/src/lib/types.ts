export interface Product {
  id: string;
  slug: string;
  name: string;
  collection: string;
  tagline: string;
  description: string;
  image_url: string;
  gallery: string[];
  price: number;
  compare_at_price: number | null;
  size_ml: number;
  rating: number;
  review_count: number;
  in_stock: boolean;
  badge: string | null;
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  longevity: string;
  sillage: string;
  ingredients: string[];
}

export interface ProductListResponse {
  items: Product[];
  total: number;
}

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  date: string;
  image_url: string;
  read_time: string;
}

export interface ActionResponse {
  id: string;
  status: string;
  message: string;
}

export interface CheckoutItem {
  product_id: string;
  name: string;
  size_ml: number;
  quantity: number;
  unit_price: number;
}

export type PaymentMethod = "prepaid" | "cod";

export interface CheckoutPreviewResponse {
  subtotal: number;
  gst: number;
  shipping: number;
  discount: number;
  cod_fee: number;
  total: number;
  free_shipping_threshold: number;
  free_shipping_remaining: number;
  promo_applied: boolean;
  payment_method: PaymentMethod;
}

export interface OrderCreateResponse {
  order_id: string;
  status: "payment_confirmed" | "cod_pending";
  message: string;
  payable_total: number;
  payment_provider: string;
  checkout_mode: "mocked" | "razorpay";
}
