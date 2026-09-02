import type { NewsItem, Product, ProductListResponse } from "@/lib/types";

const image = {
  citrus: "https://images.unsplash.com/photo-1594913615593-e4b8c44625be?auto=format&fit=crop&w=1000&q=85",
  noir: "https://images.unsplash.com/photo-1643797517714-a273548abc3c?auto=format&fit=crop&w=1000&q=85",
  amber: "https://images.unsplash.com/photo-1622618991746-fe6004db3a47?auto=format&fit=crop&w=1000&q=85",
  blue: "https://images.unsplash.com/photo-1717852885839-166ce0621811?auto=format&fit=crop&w=1000&q=85",
  editorial: "https://images.unsplash.com/photo-1758871993077-e084cc7eca86?auto=format&fit=crop&w=1000&q=85",
  rose: "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=1000&q=85",
};

const shared = {
  top_notes: ["Bergamot", "Lemon", "Sea salt"],
  heart_notes: ["Lavender", "Neroli", "Mineral air"],
  base_notes: ["Vetiver", "Cedar", "White musk"],
  longevity: "8–10 hours",
  sillage: "Moderate",
  ingredients: ["Denatured alcohol", "Parfum", "Aqua", "Limonene"],
};

export const MOCK_PRODUCTS: Product[] = [
  { id: "p-citrus-noir", slug: "citrus-noir", name: "Citrus Noir", collection: "Fresh", tagline: "Brightness with a beautiful shadow.", description: "A luminous, mineral citrus that settles into a clean, confident trail. Made for first impressions that stay.", image_url: image.citrus, gallery: [image.citrus, image.editorial], price: 1200, compare_at_price: 1450, size_ml: 100, rating: 4.9, review_count: 128, in_stock: true, badge: "Bestseller", ...shared },
  { id: "p-amber-veil", slug: "amber-veil", name: "Amber Veil", collection: "Warm", tagline: "Soft light, held close.", description: "A warm amber veil woven with saffron and a touch of vanilla. Quietly magnetic, never loud.", image_url: image.amber, gallery: [image.amber, image.rose], price: 1490, compare_at_price: 1690, size_ml: 50, rating: 4.8, review_count: 86, in_stock: true, badge: "New release", ...shared },
  { id: "p-nocturne", slug: "nocturne", name: "Nocturne", collection: "Woody", tagline: "A darker kind of calm.", description: "Smoked woods and black tea on a polished skin scent. Composed for late rooms and long conversations.", image_url: image.noir, gallery: [image.noir, image.editorial], price: 1750, compare_at_price: 1990, size_ml: 100, rating: 4.7, review_count: 64, in_stock: true, badge: "Unisex", ...shared },
  { id: "p-azure-skin", slug: "azure-skin", name: "Azure Skin", collection: "Aquatic", tagline: "The air after rain.", description: "Salted skin, crisp cypress and a cool blue horizon. An effortless everyday signature.", image_url: image.blue, gallery: [image.blue, image.citrus], price: 990, compare_at_price: 1190, size_ml: 50, rating: 4.6, review_count: 42, in_stock: true, badge: null, ...shared },
  { id: "p-velvet-fig", slug: "velvet-fig", name: "Velvet Fig", collection: "Sweet", tagline: "A little green. A little undone.", description: "Ripe fig and creamy woods with a sheer floral lift. A modern gourmand with an editorial edge.", image_url: image.rose, gallery: [image.rose, image.amber], price: 1350, compare_at_price: 1590, size_ml: 50, rating: 4.8, review_count: 73, in_stock: true, badge: "Staff pick", ...shared },
  { id: "p-saffron-neroli", slug: "saffron-neroli", name: "Saffron Neroli", collection: "Floral", tagline: "Bright petals, warm skin.", description: "A radiant floral with neroli, saffron and creamy sandalwood. Polished, personal and easy to love.", image_url: image.editorial, gallery: [image.editorial, image.amber], price: 1100, compare_at_price: null, size_ml: 100, rating: 4.5, review_count: 31, in_stock: true, badge: "Everyday", ...shared },
];

export const MOCK_NEWS: NewsItem[] = [
  { id: "n-01", slug: "how-to-build-a-scent-wardrobe", title: "How to build a scent wardrobe", excerpt: "Three moods, three bottles, one very personal ritual.", body: "A fragrance wardrobe is less about owning more and more about choosing with intention. Start with a bright daytime signature, add something with texture for evenings, and keep one quiet skin scent for yourself.", category: "Rituals", date: "2026-04-04", image_url: image.amber, read_time: "4 min read" },
  { id: "n-02", slug: "the-art-of-the-first-spray", title: "The art of the first spray", excerpt: "Why the opening is only the beginning of your fragrance story.", body: "The first spray is an introduction, not a verdict. Give the top notes a few minutes to soften, then notice what the heart brings forward as the warmth of skin changes the composition.", category: "Notes", date: "2026-03-18", image_url: image.rose, read_time: "3 min read" },
  { id: "n-03", slug: "behind-the-bottle", title: "Behind the bottle", excerpt: "A closer look at the objects that hold our everyday rituals.", body: "We believe the bottle should feel as considered as the fragrance inside it: clear lines, comfortable weight and a silhouette that earns its place on your shelf.", category: "Studio", date: "2026-02-22", image_url: image.citrus, read_time: "5 min read" },
];

export const mockProductResponse: ProductListResponse = { items: MOCK_PRODUCTS, total: MOCK_PRODUCTS.length };

export function mockCalculate(items: Array<{ unit_price: number; quantity: number }>, paymentMethod: "prepaid" | "cod", promoCode?: string) {
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) * 100) / 100;
  const promoApplied = paymentMethod === "prepaid" && (!promoCode || promoCode.toUpperCase() === "PREPAID10");
  const discount = promoApplied ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const taxable = Math.max(subtotal - discount, 0);
  const gst = Math.round(taxable * 0.18 * 100) / 100;
  const shipping = subtotal >= 999 ? 0 : 99;
  const codFee = paymentMethod === "cod" ? 80 : 0;
  return { subtotal, gst, shipping, discount, cod_fee: codFee, total: Math.round((taxable + gst + shipping + codFee) * 100) / 100, free_shipping_threshold: 999, free_shipping_remaining: Math.max(999 - subtotal, 0), promo_applied: promoApplied, payment_method: paymentMethod };
}
