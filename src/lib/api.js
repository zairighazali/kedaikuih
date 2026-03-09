// frontend/src/lib/api.js
// Axios API client — automatically attaches Firebase ID token to all requests

import axios from "axios";
import { getIdToken } from "./firebase";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({ baseURL: BASE_URL });

// Attach auth token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // Not logged in — public endpoint, proceed without token
  }
  return config;
});

// Global error normalization
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || "Ralat tidak diketahui";
    return Promise.reject(new Error(message));
  }
);

// ─── Products ────────────────────────────────────────────────
export const productsApi = {
  list:       (params) => api.get("/products", { params }),
  categories: ()       => api.get("/products/categories"),
  get:        (id)     => api.get(`/products/${id}`),
  adminAll:   ()       => api.get("/products/admin/all"),
  create:     (data)   => api.post("/products", data),
  update:     (id, d)  => api.put(`/products/${id}`, d),
  remove:     (id)     => api.delete(`/products/${id}`),
};

// ─── Auth / User ─────────────────────────────────────────────
export const authApi = {
  sync:     (data)  => api.post("/auth/sync", data),
  me:       ()      => api.get("/auth/me"),
  updateMe: (data)  => api.put("/auth/me", data),
  setAdmin: (uid)   => api.post("/auth/set-admin", { firebase_uid: uid }),
};

// ─── Orders ──────────────────────────────────────────────────
export const ordersApi = {
  create:       (data)         => api.post("/orders", data),
  myOrders:     ()             => api.get("/orders/my"),
  get:          (id)           => api.get(`/orders/${id}`),
  list:         (params)       => api.get("/orders", { params }),
  updateStatus: (id, status)   => api.put(`/orders/${id}/status`, { status }),
};

// ─── Payments ────────────────────────────────────────────────
export const paymentApi = {
  create:    (order_id) => api.post("/payment/create", { order_id }),
  getStatus: (orderId)  => api.get(`/payment/status/${orderId}`),
};

// ─── Affiliates ───────────────────────────────────────────────
export const affiliatesApi = {
  register:       (data)           => api.post("/affiliates/register", data),
  track:          (affiliate_code) => api.post("/affiliates/track", { affiliate_code }),
  me:             ()               => api.get("/affiliates/me"),
  leaderboard:    ()               => api.get("/affiliates/leaderboard"),
  list:           ()               => api.get("/affiliates"),
  approve:        (id, data)       => api.put(`/affiliates/${id}/approve`, data),
  setCommission:  (id, data)       => api.put(`/affiliates/${id}/commission`, data),
  payout:         (id)             => api.post(`/affiliates/${id}/payout`),
};

// ─── Promo / Settings ────────────────────────────────────────
export const promoApi = {
  validate: (promo_code) => api.post("/promo/validate", { promo_code }),
};

export const settingsApi = {
  getShipping:    ()       => api.get("/settings/shipping"),
  updateShipping: (data)   => api.put("/settings/shipping", data),
  getSite:        ()       => api.get("/settings/site"),
  updateSite:     (k, v)   => api.put("/settings/site", { key: k, value: v }),
};

export default api;