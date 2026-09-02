import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { apiGet, apiPost, apiPut } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  size_ml: number;
  quantity: number;
  unit_price: number;
}

export interface CustomerOrder {
  order_id: string;
  status: string;
  payable_total: number;
  items: OrderItem[];
  created_at: string;
  message: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  checkEmail: (email: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; name?: string; phone?: string; address?: string; city?: string; state?: string; pincode?: string }) => Promise<User>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  logout: () => void;
  fetchMyOrders: () => Promise<CustomerOrder[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "mmp_user_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).user : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).token : null;
    } catch {
      return null;
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (user && token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user, token]);

  const openAuthModal = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  const checkEmail = async (email: string): Promise<boolean> => {
    try {
      const res = await apiPost<{ exists: boolean }>("/auth/check-email", { email });
      return res.exists;
    } catch {
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiPost<{ user: User; token: string }>("/auth/login", { email, password });
    setUser(res.user);
    setToken(res.token);
    return res.user;
  };

  const register = async (data: { email: string; password: string; name?: string; phone?: string; address?: string; city?: string; state?: string; pincode?: string }): Promise<User> => {
    const res = await apiPost<{ user: User; token: string }>("/auth/register", data);
    setUser(res.user);
    setToken(res.token);
    return res.user;
  };

  const updateProfile = async (data: Partial<User>): Promise<User> => {
    if (!user?.email) throw new Error("No user email");
    const res = await apiPut<{ user: User }>("/auth/profile", { email: user.email, ...data });
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const fetchMyOrders = async (): Promise<CustomerOrder[]> => {
    if (!user?.email) return [];
    try {
      return await apiGet<CustomerOrder[]>(`/orders/my-orders?email=${encodeURIComponent(user.email)}`);
    } catch {
      return [];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authModalOpen,
        openAuthModal,
        closeAuthModal,
        checkEmail,
        login,
        register,
        updateProfile,
        logout,
        fetchMyOrders
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
