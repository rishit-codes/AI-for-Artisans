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

// For multipart/form-data uploads — no Content-Type here, the browser sets
// its own (with the multipart boundary) when given a FormData body.
function authHeadersMultipart(): HeadersInit {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Uploaded files are served by the backend (e.g. /uploads/products/x.jpg);
// seeded demo images live in the frontend's own /public/images and stay
// relative. Resolve only backend-served paths to an absolute URL.
export function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads/")) return `${BASE_URL}${url}`;
  return url;
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
  id: string;
  artisan_id: string;
  name: string;
  material?: string;
  description?: string;
  category?: string;
  image_url?: string;
  price: number;
  stock_qty: number;
  is_listed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWritePayload {
  name: string;
  material?: string;
  description?: string;
  category?: string;
  image_url?: string;
  price: number;
  stock_qty: number;
  is_listed?: boolean;
}

export async function getProducts(): Promise<Product[]> {
  return apiGet<Product[]>("/products");
}

export async function createProduct(data: ProductWritePayload): Promise<Product> {
  return apiPost<Product>("/products", data);
}

export async function updateProduct(id: string, data: Partial<ProductWritePayload>): Promise<Product> {
  const res = await fetch(`${BASE_URL}/products/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Product>(res);
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
}

/* ---------- uploads ---------- */

async function uploadImage(path: string, file: File): Promise<Record<string, string>> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: authHeadersMultipart(),
    body: formData,
  });
  return handleResponse<Record<string, string>>(res);
}

export async function uploadAvatar(file: File): Promise<{ avatar_url: string }> {
  return uploadImage("/upload/avatar", file) as Promise<{ avatar_url: string }>;
}

export async function uploadProductImage(file: File): Promise<{ image_url: string }> {
  return uploadImage("/upload/product-image", file) as Promise<{ image_url: string }>;
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

export async function getMandiArbitrage(localCity?: string) {
  const qs = localCity ? `?local_city=${encodeURIComponent(localCity)}` : "";
  return apiGet<{
    local_city: string;
    markets: string[];
    rows: Array<{
      item: string;
      hindi: string;
      category: string;
      unit: string;
      prices: number[];
      delta: number;
      sparkline: number[];
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
  }>(`/materials/mandi-arbitrage${qs}`);
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

async function downloadFileResponse(res: Response, defaultFilename: string, errorMessage: string) {
  if (!res.ok) throw new Error(errorMessage);
  const blob = await res.blob();
  const contentDisposition = res.headers.get("Content-Disposition");
  let filename = defaultFilename;
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

export async function downloadSourcingSheetCsvApi(payload: { commodity_name: string; quantity: number; destination_city?: string }) {
  const res = await fetch(`${BASE_URL}/materials/download-sourcing-sheet-csv`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  await downloadFileResponse(res, "Sourcing-Order-Sheet.csv", "Failed to generate sourcing sheet CSV.");
}

export async function downloadSourcingSheetPdfApi(payload: { commodity_name: string; quantity: number; destination_city?: string }) {
  const res = await fetch(`${BASE_URL}/materials/download-sourcing-sheet-pdf`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  await downloadFileResponse(res, "Sourcing-Order-Sheet.pdf", "Failed to generate sourcing sheet PDF.");
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

/* ---------- public karigar card ---------- */

export interface PublicKarigarProduct {
  id: string;
  name: string;
  material?: string;
  description?: string;
  category?: string;
  image_url?: string;
  price: number;
  stock_qty: number;
  is_listed: boolean;
}

export interface PublicKarigarProfile {
  id: string;
  full_name: string;
  craft_type?: string;
  location?: string;
  avatar_url?: string;
  craft_story?: string;
  gi_certified: boolean;
  gi_year?: string;
  languages?: string;
  member_since: number;
  products: PublicKarigarProduct[];
}

export async function getPublicKarigarProfile(userId: string): Promise<PublicKarigarProfile> {
  const res = await fetch(`${BASE_URL}/users/${userId}/public`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<PublicKarigarProfile>;
}

/* ---------- purchases (raw materials, for GST input tax credit) ---------- */

export interface Purchase {
  id: string;
  artisan_id: string;
  material_name: string;
  amount: number;
  gst_rate: number;
  purchase_date: string;
  notes?: string;
  created_at: string;
}

export interface PurchaseCreatePayload {
  material_name: string;
  amount: number;
  gst_rate: number;
  purchase_date: string;
  notes?: string;
}

export async function getPurchaseHistory(fromDate?: string, toDate?: string): Promise<Purchase[]> {
  const params = new URLSearchParams();
  if (fromDate) params.set("from_date", fromDate);
  if (toDate) params.set("to_date", toDate);
  return apiGet<Purchase[]>(`/purchases/history${params.toString() ? `?${params}` : ""}`);
}

export async function recordPurchase(payload: PurchaseCreatePayload): Promise<Purchase> {
  return apiPost<Purchase>("/purchases/record", payload);
}

/* ---------- sales ---------- */

export interface SaleCreatePayload {
  product_id: string;
  quantity: number;
  price_per_unit: number;
  unit_cost?: number;
  channel?: string;
  sale_date: string;
  notes?: string;
}

export interface SaleResponse {
  id: string;
  total_amount: number;
  profit: number;
  profit_is_estimated: boolean;
  updated_stock: number;
}

export async function recordSale(payload: SaleCreatePayload): Promise<SaleResponse> {
  return apiPost<SaleResponse>("/sales/record", payload);
}

/* ---------- GST filing helper ---------- */

export interface GstCategoryBreakdown {
  category: string;
  taxable_value: number;
  gst_rate: number;
  output_gst: number;
}

export interface GstSummary {
  period_start: string;
  period_end: string;
  total_sales: number;
  taxable_value: number;
  output_gst: number;
  input_gst: number;
  net_payable: number;
  category_breakdown: GstCategoryBreakdown[];
  sale_count: number;
  purchase_count: number;
}

export async function getGstSummary(fromDate?: string, toDate?: string): Promise<GstSummary> {
  const params = new URLSearchParams();
  if (fromDate) params.set("from_date", fromDate);
  if (toDate) params.set("to_date", toDate);
  return apiGet<GstSummary>(`/gst/summary${params.toString() ? `?${params}` : ""}`);
}

/* ---------- reports ---------- */

export interface ReportsMonth {
  month: string;
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  orders: number;
}

export interface ReportsCategory {
  category: string;
  revenue: number;
  units: number;
}

export interface ReportsSummary {
  monthly: ReportsMonth[];
  categories: ReportsCategory[];
  total_products: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  total_orders: number;
}

export async function getReportsSummary(months = 6): Promise<ReportsSummary> {
  return apiGet<ReportsSummary>(`/sales/reports-summary?months=${months}`);
}

async function downloadGstFile(path: string, fromDate: string | undefined, toDate: string | undefined, defaultFilename: string, errorMessage: string) {
  const params = new URLSearchParams();
  if (fromDate) params.set("from_date", fromDate);
  if (toDate) params.set("to_date", toDate);
  const res = await fetch(`${BASE_URL}${path}${params.toString() ? `?${params}` : ""}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(errorMessage);
  const blob = await res.blob();
  const contentDisposition = res.headers.get("Content-Disposition");
  let filename = defaultFilename;
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

export async function downloadGstSummaryCsv(fromDate?: string, toDate?: string) {
  await downloadGstFile("/gst/export-csv", fromDate, toDate, "GST-Summary.csv", "Failed to download the GST summary CSV.");
}

export async function downloadGstSummaryPdf(fromDate?: string, toDate?: string) {
  await downloadGstFile("/gst/export-pdf", fromDate, toDate, "GST-Summary.pdf", "Failed to download the GST summary PDF.");
}

export { BASE_URL };
