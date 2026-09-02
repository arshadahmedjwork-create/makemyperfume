import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, Leaf, ShieldCheck, Sparkles, Star } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { apiGet } from "@/lib/api";
import { MOCK_NEWS, mockProductResponse } from "@/lib/mockData";
import type { NewsItem, ProductListResponse } from "@/lib/types";

const moods = ["Fresh", "Woody", "Sweet", "Spicy", "Aquatic", "Floral"];
const heroSlides = [
  { image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=1400&q=85", alt: "Minimal amber perfume bottle on a soft editorial background", number: "01", name: "CITRUS NOIR", note: "Freshness of citron" },
  { image: "https://images.unsplash.com/photo-1622618991746-fe6004db3a47?auto=format&fit=crop&w=1400&q=85", alt: "Warm amber perfume bottle in natural light", number: "02", name: "AMBER VEIL", note: "Saffron, amberwood, vanilla" },
  { image: "https://images.unsplash.com/photo-1643797517714-a273548abc3c?auto=format&fit=crop&w=1400&q=85", alt: "Dark fragrance bottle in a nocturnal still life", number: "03", name: "NOCTURNE", note: "Black tea and smoked woods" },
];
const reviews = [
  { quote: "A beautiful, unhurried scent. It feels like standing near the ocean just after sunrise.", author: "Ananya R.", label: "Customer review" },
  { quote: "Amber Veil settles so softly on skin. Warm, elegant and never too sweet — exactly what I wanted.", author: "Meera K.", label: "Customer review" },
  { quote: "Nocturne lasts through the evening without becoming heavy. I keep reaching for it before dinner.", author: "Arjun S.", label: "Customer review" },
];

export default function Home() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const heroTimer = window.setInterval(() => setHeroIndex((current) => (current + 1) % heroSlides.length), 3800);
    const reviewTimer = window.setInterval(() => setReviewIndex((current) => (current + 1) % reviews.length), 4200);
    return () => { window.clearInterval(heroTimer); window.clearInterval(reviewTimer); };
  }, []);
  const { data: products } = useQuery({ queryKey: ["products", "home"], queryFn: async () => { try { return await apiGet<ProductListResponse>("/products"); } catch { return mockProductResponse; } } });
  const { data: news } = useQuery({ queryKey: ["news", "home"], queryFn: async () => { try { return await apiGet<NewsItem[]>("/news"); } catch { return MOCK_NEWS; } } });
  const featured = (products?.items ?? mockProductResponse.items).slice(0, 4);
  return <>
    <section className="hero-section page-width" data-testid="home-hero"><div className="hero-copy"><p className="eyebrow">The 2026 edit <span>·</span> MMPI</p><h1>A scent <em>to remember.</em></h1><p className="hero-description">Fragrance is not what you wear.<br />It is what remains.</p><div className="hero-actions"><Link to="/collection" className="button button-gold" data-testid="hero-shop-button">Explore collection <ArrowRight size={16} /></Link><a href="#scent-finder" className="button button-outline" data-testid="hero-finder-button">Find your scent</a></div><div className="hero-footnote"><span>Made in India</span><span>100% vegan</span><span>Small-batch EDP</span></div></div><div className="hero-visual" data-testid="hero-carousel">{heroSlides.map((slide, index) => <img key={slide.name} className={`hero-slide ${index === heroIndex ? "active" : ""}`} src={slide.image} alt={slide.alt} aria-hidden={index !== heroIndex} />)}<div className="hero-caption" key={heroSlides[heroIndex].name} data-testid="hero-active-slide"><span>{heroSlides[heroIndex].number} / 03</span><strong>{heroSlides[heroIndex].name}</strong><small>{heroSlides[heroIndex].note}</small></div><div className="hero-dots" aria-label={`Slide ${heroIndex + 1} of ${heroSlides.length}`}>{heroSlides.map((slide, index) => <span key={slide.name} className={index === heroIndex ? "active" : ""} />)}</div><div className="hero-scroll"><ArrowDown size={14} /> Scroll to explore</div></div></section>
    <section className="manifesto-section page-width" data-testid="brand-manifesto"><div className="manifesto-aside"><p className="eyebrow">01 · Scent / memory</p><span className="vertical-rule" /></div><div><p className="eyebrow">The composition</p><h2>Fresh.<br /><em>Citrus.</em><br />Deep.</h2><p className="large-copy">Every note, a different way of being.</p></div><div className="manifesto-note"><Sparkles size={18} /><p>We compose in layers, so the story changes with you.</p><Link to="/about" className="gold-link" data-testid="manifesto-about-link">Our point of view <ArrowRight size={15} /></Link></div></section>
    <section className="section page-width" data-testid="featured-products"><div className="section-heading"><div><p className="eyebrow">The edit</p><h2>Curated for <em>feeling.</em></h2></div><Link to="/collection" className="text-link" data-testid="featured-view-all-link">View all fragrances <ArrowUpRightIcon /></Link></div><div className="product-grid">{featured.map((product) => <ProductCard key={product.id} product={product} featured />)}</div></section>
    <section className="scent-finder-section page-width" id="scent-finder" data-testid="scent-finder"><div className="finder-intro"><p className="eyebrow">A little guidance</p><h2>What are you<br /><em>in the mood for?</em></h2><p>Tell us a feeling. We’ll point you toward a bottle.</p></div><div className="mood-list">{moods.map((mood, index) => <Link to={`/collection?collection=${mood}`} key={mood} data-testid={`mood-${mood.toLowerCase()}-link`}><span>0{index + 1}</span>{mood}<ArrowUpRightIcon /></Link>)}</div><div className="finder-image"><img src="https://images.unsplash.com/photo-1758871993077-e084cc7eca86?auto=format&fit=crop&w=900&q=85" alt="Perfume bottle and botanicals in a warm editorial scene" loading="lazy" /></div></section>
    <section className="point-of-view page-width" data-testid="point-of-view"><div className="point-image"><img src="https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=1000&q=85" alt="Elegant perfume bottle on a stone surface" loading="lazy" /></div><div className="point-copy"><p className="eyebrow">Our point of view</p><h2>Fragrance is not what you wear.<br /><em>It’s what people remember.</em></h2><Link to="/about" className="button button-dark" data-testid="point-view-button">Enter the world <ArrowRight size={16} /></Link></div></section>
    <section className="reviews-section page-width" data-testid="review-carousel"><div className="review-heading"><p className="eyebrow">A quiet following</p><span>{String(reviewIndex + 1).padStart(2, "0")} / 03</span></div><div className="review-slide" key={reviews[reviewIndex].author} data-testid="active-home-review"><blockquote>“{reviews[reviewIndex].quote}”</blockquote><div className="review-author"><span className="stars"><Star fill="currentColor" size={13} /><Star fill="currentColor" size={13} /><Star fill="currentColor" size={13} /><Star fill="currentColor" size={13} /><Star fill="currentColor" size={13} /></span><span>{reviews[reviewIndex].author} · {reviews[reviewIndex].label}</span></div></div></section>
    <section className="section page-width news-preview" data-testid="latest-news-preview"><div className="section-heading"><div><p className="eyebrow">The letter</p><h2>The world of fragrance, <em>delivered.</em></h2></div><Link to="/news" className="text-link" data-testid="news-preview-link">Read the journal <ArrowRight size={15} /></Link></div><div className="news-grid">{(news ?? MOCK_NEWS).slice(0, 3).map((item) => <Link to={`/news/${item.slug}`} key={item.id} className="news-card" data-testid={`news-card-${item.slug}`}><img src={item.image_url} alt="" loading="lazy" /><div><p className="eyebrow">{item.category} <span>·</span> {item.read_time}</p><h3>{item.title}</h3><p>{item.excerpt}</p></div></Link>)}</div></section>
    <section className="trust-strip page-width" data-testid="trust-strip"><div><ShieldCheck size={20} /><span><strong>Thoughtfully made</strong> Vegan, small-batch formulas</span></div><div><Leaf size={20} /><span><strong>India-wide delivery</strong> Free over ₹999</span></div><div><Sparkles size={20} /><span><strong>Easy to love</strong> 10% off prepaid orders</span></div></section>
  </>;
}

function ArrowUpRightIcon() { return <ArrowRight size={15} />; }
