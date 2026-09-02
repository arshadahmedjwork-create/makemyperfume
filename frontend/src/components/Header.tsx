import { useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingBag, Sun, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

const links = [
  ["Shop all", "/collection"],
  ["Best sellers", "/collection?category=bestsellers"],
  ["Find your scent", "/#scent-finder"],
  ["Latest news", "/news"],
  ["About", "/about"],
  ["Contact", "/contact"],
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
  const navigate = useNavigate();
  const { itemCount, openCart } = useCart();
  const { user, openAuthModal } = useAuth();

  const submitSearch = (event?: KeyboardEvent<HTMLInputElement>) => {
    if (event && event.key !== "Enter") return;
    navigate(`/collection${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`);
    setSearchOpen(false);
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setDark((value) => !value);
  };

  return (
    <>
      <div className="announcement" data-testid="announcement-bar" aria-label="Store offers">
        <div className="announcement-track">
          {[0, 1].map((group) => <div className="announcement-group" key={group} aria-hidden={group === 1}>
            <span>Complimentary shipping over ₹999</span><b>✦</b><span>Extra 10% off on prepaid orders</span><b>✦</b><span>Made in India</span><b>✦</b>
          </div>)}
        </div>
      </div>
      <header className="site-header" data-testid="site-header">
        <div className="site-header-inner page-width">
          <Button variant="ghost" size="icon" className="mobile-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Close menu" : "Open menu"} data-testid="mobile-menu-toggle">
            {menuOpen ? <X /> : <Menu />}
          </Button>
          <Link to="/" className="wordmark" onClick={() => setMenuOpen(false)} data-testid="navbar-brand-logo">MAKE MY <span>PERFUME</span></Link>
          <nav className={`desktop-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation" data-testid="main-navigation">
            {links.map(([label, href]) => <Link key={href} to={href} onClick={() => setMenuOpen(false)} data-testid={`nav-${label.replaceAll(" ", "-")}-link`}>{label}</Link>)}
          </nav>
          <div className="header-actions">
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen((value) => !value)} aria-label="Search fragrances" data-testid="nav-search-button"><Search /></Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={dark ? "Use light theme" : "Use dark theme"} data-testid="theme-toggle-button"><Sun /></Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={openAuthModal}
              aria-label={user ? `Account: ${user.email}` : "Customer login"}
              className="relative"
              data-testid="nav-account-button"
            >
              <User />
              {user && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />}
            </Button>
            <Button variant="ghost" size="icon" className="cart-button" onClick={openCart} aria-label={`Open cart, ${itemCount} items`} data-testid="cart-drawer-toggle"><ShoppingBag /><span className="cart-count" data-testid="cart-item-count">{itemCount}</span></Button>
          </div>
        </div>
        {searchOpen && <div className="search-bar page-width" data-testid="header-search-panel"><Search size={16} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={submitSearch} placeholder="Search by mood, note or name" aria-label="Search fragrances" data-testid="nav-search-input" /><button type="button" onClick={() => submitSearch()} data-testid="nav-search-submit">Search</button></div>}
      </header>
    </>
  );
}

