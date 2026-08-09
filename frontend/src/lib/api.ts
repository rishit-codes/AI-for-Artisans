/**
 * Centralized API client for communicating with the FastAPI backend.
 *
 * Uses native fetch (no Axios dependency). Attaches JWT Bearer tokens
 * automatically and handles 401 token expiry.
 */

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://ai-for-artisans.onrender.com" : "http://localhost:8000");

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

export async function updateProfile(userData: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

/* ---------- dashboard ---------- */

export async function getDashboardSummary() {
  return apiGet<Record<string, unknown>>("/dashboard/summary");
}

export async function getDashboardPriority() {
  return apiGet<Record<string, unknown>>("/dashboard/priority");
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

export async function getMandiArbitrage() {
  return apiGet<{
    markets: string[];
    rows: Array<{
      item: string;
      hindi: string;
      category: string;
      unit: string;
      prices: number[];
      delta: number;
      supply: string;
      lowest_mandi: string;
      arbitrage_savings: string;
      updated_at: string;
    }>;
    suppliers: Array<{
      name: string;
      item: string;
      lead: string;
      trust: number;
      savings: string;
      mandi: string;
    }>;
  }>("/materials/mandi-arbitrage");
}

export async function getMandiScrapingLogs(limit = 50) {
  return apiGet<Array<{
    id: number;
    log_id: string;
    mandi_city: string;
    commodity_name: string;
    price_per_unit: number;
    unit: string;
    status_code: number;
    response_time_ms: number;
    scraped_at: string;
  }>>(`/materials/scraping-logs?limit=${limit}`);
}

export async function triggerMandiScrape() {
  return apiPost<Record<string, unknown>>("/materials/trigger-mandi-scrape");
}

export interface ArbitrageCalcResult {
  commodity_name: string;
  hindi_name: string;
  unit: string;
  quantity: number;
  local_city: string;
  local_unit_price: number;
  local_total_cost: number;
  recommended_mandi: string;
  recommended_delivered_unit_price: number;
  recommended_total_delivered_cost: number;
  freight_cost: number;
  net_savings: number;
  net_savings_pct: number;
  breakdown: Array<{
    mandi_city: string;
    unit_price: number;
    raw_material_cost: number;
    freight_cost: number;
    total_delivered_cost: number;
    savings_vs_local: number;
    lead_time: string;
    is_best: boolean;
  }>;
}

export async function calculateArbitrage(payload: { commodity_name: string; quantity: number; destination_city?: string }) {
  return apiPost<ArbitrageCalcResult>("/materials/calculate-arbitrage", payload);
}

export async function exportCSVApi() {
  const res = await fetch(`${BASE_URL}/materials/export-csv`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to export CSV.");
  const blob = await res.blob();
  const contentDisposition = res.headers.get("Content-Disposition");
  let filename = `mandi-arbitrage-prices-${new Date().toISOString().slice(0, 10)}.csv`;
  if (contentDisposition && contentDisposition.includes("filename=")) {
    filename = contentDisposition.split("filename=")[1].replace(/"/g, "");
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadSourcingSheetApi(payload: { commodity_name: string; quantity: number; destination_city?: string }) {
  const res = await fetch(`${BASE_URL}/materials/download-sourcing-sheet`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to generate sourcing sheet download.");
  const blob = await res.blob();
  const contentDisposition = res.headers.get("Content-Disposition");
  let filename = "Sourcing-Order-Sheet.txt";
  if (contentDisposition && contentDisposition.includes("filename=")) {
    filename = contentDisposition.split("filename=")[1].replace(/"/g, "");
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
