import { Link } from "react-router-dom";
import { ArrowUpRight, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export default function ProductCard({ product, featured = false }: { product: Product; featured?: boolean }) {
  const { addItem, openCart } = useCart();
  const testKey = product.slug;
  const add = () => { addItem(product); openCart(); toast.success(`${product.name} added to your cart`); };
  return <article className={`product-card ${featured ? "product-card-featured" : ""}`} data-testid={`product-card-${testKey}`}>
    <Link to={`/product/${product.slug}`} className="product-image-link" data-testid={`product-card-link-${testKey}`}><div className="product-image-wrap"><img src={product.image_url} alt={`${product.name} fragrance bottle`} loading="lazy" /><span className="product-image-arrow"><ArrowUpRight size={17} /></span>{product.badge && <Badge className="product-badge" data-testid={`product-badge-${testKey}`}>{product.badge}</Badge>}</div></Link>
    <div className="product-card-copy"><div className="product-card-meta"><span>{product.collection}</span><span className="rating"><Star size={12} fill="currentColor" /> {product.rating}</span></div><Link to={`/product/${product.slug}`} className="product-name" data-testid={`product-name-${testKey}`}>{product.name}</Link><p className="product-tagline">{product.tagline}</p><div className="product-card-bottom"><div><strong>₹{product.price.toLocaleString("en-IN")}</strong><small>{product.size_ml} ml</small></div><Button size="icon-sm" variant="outline" onClick={add} aria-label={`Add ${product.name} to cart`} data-testid={`product-card-add-to-cart-${testKey}`}><Plus /></Button></div></div>
  </article>;
}
