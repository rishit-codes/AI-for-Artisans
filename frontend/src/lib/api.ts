/**
 * Centralized API client for communicating with the FastAPI backend.
 *
 * Uses native fetch (no Axios dependency). Attaches JWT Bearer tokens
 * automatically and handles 401 token expiry.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ---------- helpers ---------- */

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Optionally redirect — handled by auth context watching storage
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ---------- generic verbs ---------- */

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders() });
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

/* ---------- auth ---------- */

export interface LoginResponse {
  access_token: string;
  user: Record<string, unknown>;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/auth/login/json", { email, password });
}

export async function registerApi(userData: Record<string, unknown>): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/auth/register", userData);
}

/* ---------- dashboard ---------- */

export async function getDashboardSummary() {
  return apiGet<Record<string, unknown>>("/dashboard/summary");
}

/* ---------- products ---------- */

export interface Product {
  id: number;
  name: string;
  craft_type: string;
  materials: string;
  base_price: number;
  time_hours: number;
  description: string;
  image_url: string;
  category: string;
}

export async function getProducts(): Promise<Product[]> {
  return apiGet<Product[]>("/products");
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  return apiPost<Product>("/products", data);
}

/* ---------- trends ---------- */

export interface TrendItem {
  id: number;
  title: string;
  description: string;
  category: string;
  source: string;
  trend_type: string;
  confidence: number;
  image_url?: string;
  tags?: string[];
  likes?: number;
  created_at?: string;
}

export async function getTrends(tab = "All Trends"): Promise<TrendItem[]> {
  return apiGet<TrendItem[]>(`/trends?tab=${encodeURIComponent(tab)}`);
}

export async function getTrendIntelligence() {
  return apiGet<Record<string, unknown>>("/trends/intelligence");
}

/* ---------- market / niche insights ---------- */

export async function getMarketInsights(category: string) {
  return apiGet<Record<string, unknown>>(`/market/insights?category=${encodeURIComponent(category)}`);
}

/* ---------- materials / mandi ---------- */

export async function getCommodities() {
  return apiGet<Record<string, unknown>[]>("/materials/commodities");
}

export async function getMandiPrices(category: string) {
  return apiGet<Record<string, unknown>[]>(`/materials/mandi?category=${encodeURIComponent(category)}`);
}

/* ---------- predictions ---------- */

export async function getSeasonalPredictions(productId: number) {
  return apiGet<Record<string, unknown>>(`/predictions/seasonal?product_id=${productId}`);
}

export async function triggerModelUpgrade(productId: number) {
  return apiPost<Record<string, unknown>>("/predictions/trigger-upgrade", { product_id: productId });
}

/* ---------- production ---------- */

export async function getProductionTimeline() {
  return apiGet<Record<string, unknown>[]>("/production/timeline");
}

/* ---------- advisor ---------- */

export async function getAdvisorFeed(artisanId: string) {
  return apiGet<Record<string, unknown>>(`/advisor/feed?artisan_id=${artisanId}`);
}

/**
 * Streaming chat — returns the raw Response so the caller can
 * read the body with a ReadableStreamReader for SSE.
 */
export async function advisorChatStream(body: Record<string, unknown>): Promise<Response> {
  const res = await fetch(`${BASE_URL}/advisor/chat`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Advisor chat failed: ${res.status}`);
  return res;
}

export { BASE_URL };
