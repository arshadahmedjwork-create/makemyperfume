import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="site-footer" data-testid="site-footer">
      <div className="page-width footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            <div className="logo-icon">
              <span>M</span><span>M</span>
              <span>P</span><span>&nbsp;</span>
            </div>
            <div className="logo-text-footer">
              <span>MAKE MY</span>
              <span>PERFUME</span>
            </div>
          </div>
          <div className="footer-social-icons">
            <a href="https://instagram.com/makemyperfume" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="https://youtube.com/@makemyperfume" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
            </a>
            <a href="https://pinterest.com/makemyperfume" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12a4 4 0 1 1 8 0c0 4-2 6-4 8"/><path d="M12 12l-2 6"/></svg>
            </a>
          </div>
        </div>
        <div className="footer-column">
          <p className="footer-label">Company Info</p>
          <Link to="/about" data-testid="footer-about-link">About Us</Link>
          <Link to="/contact" data-testid="footer-contact-link">Careers</Link>
          <Link to="/news" data-testid="footer-news-link">Blogs</Link>
        </div>
        <div className="footer-column">
          <p className="footer-label">Support</p>
          <Link to="/contact" data-testid="footer-faq-link">FAQs</Link>
          <Link to="/contact" data-testid="footer-track-link">Track Order</Link>
          <Link to="/about" data-testid="footer-store-link">Store Locator</Link>
        </div>
        <div className="footer-column">
          <p className="footer-label">Explore</p>
          <Link to="/collection" data-testid="footer-shop-link">Shop All</Link>
          <Link to="/collection?collection=Fresh" data-testid="footer-fresh-link">Fresh</Link>
          <Link to="/collection?collection=Woody" data-testid="footer-woody-link">Woody</Link>
        </div>
      </div>
      <div className="page-width footer-bottom">
        <span>© 2026 Make My Perfume</span>
        <span>
          <a href="mailto:hello@makemyperfume.in" className="footer-email" data-testid="footer-email-link">
            hello@makemyperfume.in <ArrowUpRight size={12} />
          </a>
        </span>
        <span>Made in India</span>
      </div>
    </footer>
  );
}
