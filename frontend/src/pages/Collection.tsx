import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { apiGet } from "@/lib/api";
import { MOCK_PRODUCTS, mockProductResponse } from "@/lib/mockData";
import type { ProductListResponse } from "@/lib/types";
import { useSearchParams } from "react-router-dom";

const collections = ["All", "Fresh", "Woody", "Sweet", "Spicy", "Aquatic", "Floral"];

export default function Collection() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const collection = params.get("collection") ?? "All";
  const [sort, setSort] = useState("featured");
  const { data, isLoading, isError } = useQuery({ queryKey: ["products", search, collection], queryFn: async () => { try { return await apiGet<ProductListResponse>(`/products?search=${encodeURIComponent(search)}&collection=${encodeURIComponent(collection)}`); } catch { return { ...mockProductResponse, items: MOCK_PRODUCTS.filter((product) => (collection === "All" || product.collection === collection) && (!search || `${product.name} ${product.tagline}`.toLowerCase().includes(search.toLowerCase()))) }; } } });
  const products = useMemo(() => [...(data?.items ?? [])].sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : sort === "rating" ? b.rating - a.rating : 0), [data?.items, sort]);
  const updateSearch = (value: string) => { setSearch(value); setParams((current) => { if (value) current.set("search", value); else current.delete("search"); return current; }, { replace: true }); };
  return <div className="collection-page page-width" data-testid="collection-page"><div className="collection-hero"><div><p className="eyebrow">The complete edit</p><h1>Find your <em>signature.</em></h1></div><p>Compositions for the moods you carry, from first light to after hours.</p></div><div className="collection-toolbar"><div className="collection-search"><Search size={17} /><Input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Search fragrances, notes or moods" aria-label="Search fragrances" data-testid="collection-search-input" />{search && <button type="button" onClick={() => updateSearch("")} aria-label="Clear search" data-testid="collection-search-clear"><X size={15} /></button>}</div><div className="toolbar-right"><label htmlFor="sort-products">Sort by <select id="sort-products" value={sort} onChange={(event) => setSort(event.target.value)} data-testid="collection-sort-select"><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Top rated</option></select></label><SlidersHorizontal size={16} /></div></div><div className="collection-filters" data-testid="collection-filters">{collections.map((item) => <button type="button" key={item} className={collection === item ? "active" : ""} onClick={() => setParams((current) => { if (item === "All") current.delete("collection"); else current.set("collection", item); return current; })} data-testid={`collection-filter-${item.toLowerCase()}`}>{item}</button>)}</div>{isLoading ? <div className="loading-state" data-testid="collection-loading-state">Curating your edit…</div> : isError ? <div className="inline-state" data-testid="collection-error-state">The studio is taking a moment. Showing our saved edit.</div> : products.length === 0 ? <div className="empty-state" data-testid="collection-empty-state"><span>○</span><h2>No match, yet.</h2><p>Try another mood or clear your search.</p><button type="button" onClick={() => { updateSearch(""); setParams({}); }} data-testid="collection-empty-clear">Clear filters</button></div> : <div className="product-grid collection-grid" data-testid="collection-product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}</div>;
}
