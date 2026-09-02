import { Link } from "react-router-dom";
import { ArrowUpRight, AtSign } from "lucide-react";

export default function Footer() {
  return <footer className="site-footer" data-testid="site-footer">
    <div className="page-width footer-grid">
      <div className="footer-brand"><p className="eyebrow">A scent to remember</p><p className="footer-title">Fragrance is not what you wear.<br /><em>It is what remains.</em></p><a href="mailto:hello@makemyperfume.in" className="footer-email" data-testid="footer-email-link">hello@makemyperfume.in <ArrowUpRight size={14} /></a></div>
      <div className="footer-column"><p className="footer-label">Explore</p><Link to="/collection" data-testid="footer-shop-link">Shop all</Link><Link to="/news" data-testid="footer-news-link">Latest news</Link><Link to="/about" data-testid="footer-about-link">Our point of view</Link><Link to="/contact" data-testid="footer-contact-link">Contact studio</Link></div>
      <div className="footer-column"><p className="footer-label">Good to know</p><Link to="/shipping-returns" data-testid="footer-shipping-link">Shipping & returns</Link><Link to="/refund-policy" data-testid="footer-refund-link">Refund policy</Link><Link to="/privacy" data-testid="footer-privacy-link">Privacy</Link><Link to="/terms" data-testid="footer-terms-link">Terms</Link></div>
    </div>
    <div className="page-width footer-bottom"><span>© 2026 Make My Perfume</span><span className="footer-social"><AtSign size={15} /> @makemyperfume</span><span>Made in India</span></div>
  </footer>;
}
