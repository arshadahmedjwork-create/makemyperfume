import { Routes, Route } from "react-router-dom";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import AuthModal from "@/components/AuthModal";
import Home from "@/pages/Home";
import StoreLayout from "@/components/StoreLayout";
import Collection from "@/pages/Collection";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import News from "@/pages/News";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Policy from "@/pages/Policy";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AuthModal />
        <Routes>
          <Route element={<StoreLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<News />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/:slug" element={<Policy />} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}

