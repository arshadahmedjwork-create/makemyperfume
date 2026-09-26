import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Leaf, ShieldCheck, Star, Truck } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { apiGet } from "@/lib/api";
import { MOCK_NEWS, mockProductResponse } from "@/lib/mockData";
import type { NewsItem, ProductListResponse } from "@/lib/types";

const heroSlides = [
  { image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=1400&q=85", alt: "Luxury perfume bottle", heading: "YOUR SIGNATURE" },
  { image: "https://images.unsplash.com/photo-1622618991746-fe6004db3a47?auto=format&fit=crop&w=1400&q=85", alt: "Premium fragrance collection", heading: "FIND YOUR SCENT" },
  { image: "https://images.unsplash.com/photo-1643797517714-a273548abc3c?auto=format&fit=crop&w=1400&q=85", alt: "Artisan perfume crafting", heading: "CRAFTED FOR YOU" },
];

const scentCategories = [
  { name: "FRESH", description: "Energize. Vitalize. Awaken.", image: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=600&q=85", collection: "Fresh" },
  { name: "FLORAL", description: "Fruity. Bloom. Candylicious.", image: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?auto=format&fit=crop&w=600&q=85", collection: "Floral" },
  { name: "WOODY", description: "Exotic. Sensual. Subtle.", image: "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=600&q=85", collection: "Woody" },
];

const genderCategories = [
  { name: "FOR HIM", image: "https://images.unsplash.com/photo-1594913615593-e4b8c44625be?auto=format&fit=crop&w=600&q=85", filter: "men" },
  { name: "FOR HER", image: "https://images.unsplash.com/photo-1622618991746-fe6004db3a47?auto=format&fit=crop&w=600&q=85", filter: "women" },
  { name: "UNISEX", image: "https://images.unsplash.com/photo-1643797517714-a273548abc3c?auto=format&fit=crop&w=600&q=85", filter: "unisex" },
];

const reviews = [
  { quote: "A beautiful, unhurried scent. It feels like standing near the ocean just after sunrise.", author: "Ananya R.", label: "Customer review" },
  { quote: "The fragrance settles so softly on skin. Warm, elegant and never too sweet.", author: "Meera K.", label: "Customer review" },
  { quote: "Lasts through the evening without becoming heavy. I keep reaching for it before dinner.", author: "Arjun S.", label: "Customer review" },
];

export default function Home() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const heroTimer = window.setInterval(() => setHeroIndex((c) => (c + 1) % heroSlides.length), 4500);
    const reviewTimer = window.setInterval(() => setReviewIndex((c) => (c + 1) % reviews.length), 4200);
    return () => { window.clearInterval(heroTimer); window.clearInterval(reviewTimer); };
  }, []);

  const { data: products } = useQuery({
    queryKey: ["products", "home"],
    queryFn: async () => {
      try { return await apiGet<ProductListResponse>("/products"); }
      catch { return mockProductResponse; }
    },
  });

  const { data: news } = useQuery({
    queryKey: ["news", "home"],
    queryFn: async () => {
      try { return await apiGet<NewsItem[]>("/news"); }
      catch { return MOCK_NEWS; }
    },
  });

  const featured = (products?.items ?? mockProductResponse.items).slice(0, 4);

  return (
    <>
      {/* Hero Banner / Carousel */}
      <section className="myop-hero" data-testid="home-hero">
        <div className="myop-hero-slides">
          {heroSlides.map((slide, i) => (
            <div key={slide.heading} className={`myop-hero-slide ${i === heroIndex ? "active" : ""}`}>
              <img src={slide.image} alt={slide.alt} />
              <div className="myop-hero-overlay">
                <h1>{slide.heading}</h1>
              </div>
            </div>
          ))}
        </div>
        <button className="myop-hero-arrow left" onClick={() => setHeroIndex((c) => (c - 1 + heroSlides.length) % heroSlides.length)} aria-label="Previous slide">
          <ChevronLeft size={24} />
        </button>
        <button className="myop-hero-arrow right" onClick={() => setHeroIndex((c) => (c + 1) % heroSlides.length)} aria-label="Next slide">
          <ChevronRight size={24} />
        </button>
        <div className="myop-hero-dots">
          {heroSlides.map((_, i) => (
            <button key={i} className={i === heroIndex ? "active" : ""} onClick={() => setHeroIndex(i)} aria-label={`Go to slide ${i + 1}`} />
          ))}
        </div>
      </section>

      {/* Explore Scents */}
      <section className="myop-section page-width" data-testid="explore-scents">
        <h2 className="myop-section-title">EXPLORE SCENTS</h2>
        <div className="myop-scent-grid">
          {scentCategories.map((cat) => (
            <Link to={`/collection?collection=${cat.collection}`} key={cat.name} className="myop-scent-card">
              <img src={cat.image} alt={cat.name} loading="lazy" />
              <div className="myop-scent-overlay">
                <h3>{cat.name}</h3>
                <p>{cat.description}</p>
                <ArrowRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="myop-section page-width" data-testid="featured-products">
        <div className="myop-section-header">
          <h2 className="myop-section-title">OUR BEST SELLERS</h2>
          <div className="myop-carousel-nav">
            <Link to="/collection" className="myop-view-all">View All <ArrowRight size={14} /></Link>
          </div>
        </div>
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} featured />
          ))}
        </div>
      </section>

      {/* Cosmopolitan Banner */}
      <section className="myop-banner" data-testid="cosmopolitan-banner">
        <div className="myop-banner-inner">
          <p className="myop-banner-small">MAKE MY PERFUME</p>
          <h2 className="myop-banner-title">COSMO<br />POLITAN</h2>
          <p className="myop-banner-sub">SCENTS OF THE WORLD</p>
        </div>
      </section>

      {/* Personalize CTA */}
      <section className="myop-personalize" data-testid="personalize-cta">
        <div className="myop-personalize-inner">
          <h2>A GIFT THAT LASTS A LIFETIME</h2>
          <Link to="/collection?collection=personalized" className="myop-personalize-btn">
            PERSONALIZE NOW <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* For Him / For Her / Unisex */}
      <section className="myop-section page-width" data-testid="gender-categories">
        <div className="myop-gender-grid">
          {genderCategories.map((cat) => (
            <Link to={`/collection?search=${cat.filter}`} key={cat.name} className="myop-gender-card">
              <img src={cat.image} alt={cat.name} loading="lazy" />
              <div className="myop-gender-overlay">
                <h3>{cat.name}</h3>
                <ArrowRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quote / Awaken Section */}
      <section className="myop-quote-section page-width" data-testid="brand-quote">
        <h2>AWAKEN YOUR OLFACTORY SENSES</h2>
        <p className="myop-quote-text">"Perfume is the art that makes memory speak." – Francis Kurkdjian</p>
      </section>

      {/* Reviews */}
      <section className="reviews-section page-width" data-testid="review-carousel">
        <div className="review-heading">
          <p className="eyebrow">Customer Love</p>
          <span>{String(reviewIndex + 1).padStart(2, "0")} / 03</span>
        </div>
        <div className="review-slide" key={reviews[reviewIndex].author} data-testid="active-home-review">
          <blockquote>"{reviews[reviewIndex].quote}"</blockquote>
          <div className="review-author">
            <span className="stars">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} fill="currentColor" size={13} />)}
            </span>
            <span>{reviews[reviewIndex].author} · {reviews[reviewIndex].label}</span>
          </div>
        </div>
      </section>

      {/* News / Journal */}
      <section className="section page-width news-preview" data-testid="latest-news-preview">
        <div className="section-heading">
          <div>
            <p className="eyebrow">From the journal</p>
            <h2>The world of fragrance, <em>delivered.</em></h2>
          </div>
          <Link to="/news" className="text-link" data-testid="news-preview-link">Read the journal <ArrowRight size={15} /></Link>
        </div>
        <div className="news-grid">
          {(news ?? MOCK_NEWS).slice(0, 3).map((item) => (
            <Link to={`/news/${item.slug}`} key={item.id} className="news-card" data-testid={`news-card-${item.slug}`}>
              <img src={item.image_url} alt="" loading="lazy" />
              <div>
                <p className="eyebrow">{item.category} <span>·</span> {item.read_time}</p>
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust Strip */}
      <section className="myop-trust-strip page-width" data-testid="trust-strip">
        <div>
          <Truck size={28} />
          <div>
            <strong>FREE SHIPPING</strong>
            <span>Free shipping on orders above ₹599 across India</span>
          </div>
        </div>
        <div>
          <ShieldCheck size={28} />
          <div>
            <strong>EASY RETURNS</strong>
            <span>Simple return process with the perfumes</span>
          </div>
        </div>
        <div>
          <Leaf size={28} />
          <div>
            <strong>SECURE PAYMENT</strong>
            <span>Your payment is processed through secure gateway</span>
          </div>
        </div>
      </section>
    </>
  );
}
