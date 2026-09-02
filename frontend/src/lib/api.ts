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
    // AuthProvider listens for this and clears its React state too — without it,
    // a token revoked server-side (e.g. by "sign out of all devices" from another
    // tab) leaves the UI looking logged in until something forces a reload.
    window.dispatchEvent(new Event("auth:unauthorized"));
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
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

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

/* ---------- auth ---------- */

export interface LoginResponse {
  access_token?: string;
  token_type?: string;
  user?: Record<string, unknown>;
  requires_2fa?: boolean;
  pending_token?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: Record<string, unknown>;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/auth/login/json", { email, password });
}

export async function registerApi(userData: Record<string, unknown>): Promise<TokenResponse> {
  return apiPost<TokenResponse>("/auth/register", userData);
}

export async function twoFaLoginApi(pendingToken: string, code: string): Promise<TokenResponse> {
  return apiPost<TokenResponse>("/auth/2fa/login", { pending_token: pendingToken, code });
}

export interface TwoFASetupResponse {
  secret: string;
  otpauth_uri: string;
  qr_code_data_uri: string;
}

export async function setup2FA(): Promise<TwoFASetupResponse> {
  return apiPost<TwoFASetupResponse>("/auth/2fa/setup");
}

export async function verify2FASetup(code: string): Promise<void> {
  await apiPost<void>("/auth/2fa/verify", { code });
}

export async function disable2FA(password: string): Promise<void> {
  await apiPost<void>("/auth/2fa/disable", { password });
}

export async function requestEmailVerification(): Promise<void> {
  await apiPost<void>("/auth/verify-email/request");
}

export async function confirmEmailVerification(token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/verify-email/${token}`, { method: "GET" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiPost<void>("/auth/password-reset/request", { email });
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  await apiPost<void>("/auth/password-reset/confirm", { token, new_password: newPassword });
}

export async function logoutAllDevicesApi(): Promise<void> {
  await apiPost<void>("/auth/logout-all");
}

export async function deleteAccountApi(password: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    method: "DELETE",
    headers: authHeaders(),
    body: JSON.stringify({ password }),
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
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

/* ---------- tasks ---------- */

export interface Task {
  id: string;
  user_id: string;
  title: string;
  source?: string;
  status: "pending" | "done" | "snoozed";
  due_date?: string;
  snoozed_until?: string;
  created_at: string;
}

export interface TaskCreatePayload {
  title: string;
  source?: string;
  due_date?: string;
  status?: "pending" | "done" | "snoozed";
}

export interface TaskUpdatePayload {
  status?: "pending" | "done" | "snoozed";
  snoozed_until?: string;
}

export async function getTasks(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiGet<Task[]>(`/tasks${qs}`);
}

export async function createTask(data: TaskCreatePayload) {
  return apiPost<Task>("/tasks", data);
}

export async function updateTask(taskId: string, data: TaskUpdatePayload) {
  return apiPatch<Task>(`/tasks/${taskId}`, data);
}

export async function deleteTask(taskId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
}

/* ---------- advisor recommendations (real, per-artisan) ---------- */

export interface AdvisorRecommendation {
  product_id: string;
  product_name: string;
  material?: string;
  image_url?: string;
  unit_revenue: number;
  unit_cost?: number;
  suggested_batch: number;
  confidence: number;
  trend_pct?: number;
  festival?: string;
  festival_days_away?: number;
  rationale: string;
  model_version: string;
  has_enough_data: boolean;
}

export interface AdvisorMaterial {
  commodity: string;
  sub?: string;
  local_price?: string;
  local_best: boolean;
  surat_price?: string;
  surat_best: boolean;
  delhi_price?: string;
  delhi_best: boolean;
  trend?: string;
  action?: string;
}

export interface AdvisorRecentPace {
  avg_units_per_week: number;
  avg_revenue_per_month: number;
  weeks_of_history: number;
}

export interface AdvisorRecommendationsResponse {
  recommendations: AdvisorRecommendation[];
  materials: AdvisorMaterial[];
  recent_pace: AdvisorRecentPace;
}

export async function getAdvisorRecommendations(capacity?: number) {
  const qs = capacity ? `?capacity=${capacity}` : "";
  return apiGet<AdvisorRecommendationsResponse>(`/advisor/recommendations${qs}`);
}

export interface PlanItem {
  id: string;
  product_id: string;
  product_name: string;
  image_url?: string;
  quantity: number;
  week: number;
  unit_revenue: number;
  unit_cost?: number;
}

export interface PlanItemCreatePayload {
  product_id: string;
  quantity: number;
  week: number;
}

export async function getPlan() {
  return apiGet<PlanItem[]>("/advisor/plan");
}

export async function addPlanItem(data: PlanItemCreatePayload) {
  return apiPost<PlanItem>("/advisor/plan", data);
}

export async function removePlanItem(itemId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/advisor/plan/${itemId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
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

/* ---------- orders ---------- */

export interface Order {
  id: string;
  artisan_id: string;
  buyer_id?: string | null;
  product_id: string | null;
  quantity: number;
  total_price: number;
  currency: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  created_at: string | null;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  carrier?: string;
  tracking_number?: string;
  shipped_at?: string;
  delivered_at?: string;
  payment_status: "pending" | "paid" | "failed";
  payment_ref?: string;
}

export interface OrderUpdatePayload {
  status?: Order["status"];
  carrier?: string;
  tracking_number?: string;
}

export async function updateOrder(orderId: string, data: OrderUpdatePayload) {
  return apiPatch<Order>(`/orders/${orderId}`, data);
}

export async function getOrders(): Promise<Order[]> {
  return apiGet<Order[]>("/orders");
}

/* ---------- marketplace (buyer-side: browse, cart checkout, sandbox pay) ---------- */

export interface MarketplaceProduct {
  id: string;
  artisan_id: string;
  artisan_name: string;
  artisan_craft_type?: string;
  artisan_location?: string;
  name: string;
  material?: string;
  description?: string;
  category?: string;
  image_url?: string;
  price: number;
  stock_qty: number;
  created_at: string;
}

export interface MarketplaceOrderPayload {
  product_id: string;
  quantity: number;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  buyer_phone?: string;
}

export async function getMarketplaceProducts(params?: { category?: string; search?: string }): Promise<MarketplaceProduct[]> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.search) qs.set("search", params.search);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiGet<MarketplaceProduct[]>(`/marketplace/products${suffix}`);
}

export async function placeMarketplaceOrder(data: MarketplaceOrderPayload): Promise<Order> {
  return apiPost<Order>("/marketplace/orders", data);
}

export async function payMarketplaceOrder(orderId: string): Promise<Order> {
  return apiPost<Order>(`/marketplace/orders/${orderId}/pay`);
}

export async function getMyPurchases(): Promise<Order[]> {
  return apiGet<Order[]>("/marketplace/orders");
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
  author: string;
  title: string;
  content: string;
  timestamp: string;
  tags: string[];
  performance_badge?: string;
  likes: string;
  comments: number;
  image_url?: string;
}

export async function getTrends(tab = "All Trends"): Promise<TrendItem[]> {
  return apiGet<TrendItem[]>(`/trends?tab=${encodeURIComponent(tab)}`);
}

export interface AiSuggestion {
  title: string;
  subtitle: string;
  text: string;
  action: string;
}

export interface MaterialForecastItem {
  name: string;
  price: string;
  status: string;
  trend: string;
}

export interface TrendIntelligence {
  ai_suggestion: Partial<AiSuggestion>;
  material_forecast: MaterialForecastItem[];
}

export async function getTrendIntelligence() {
  return apiGet<TrendIntelligence>("/trends/intelligence");
}

/* ---------- market / niche insights ---------- */

export interface MarketInsightItem {
  niche: string;
  confidence_score: number;
  status: string;
  trend_momentum: string;
  upcoming_season: string;
}

export interface MarketInsightsResponse {
  category: string;
  insights: MarketInsightItem[];
}

export async function getMarketInsights(category: string) {
  return apiGet<MarketInsightsResponse>(`/market/insights?category=${encodeURIComponent(category)}`);
}

/* ---------- materials / mandi ---------- */

export async function getCommodities() {
  return apiGet<Record<string, unknown>[]>("/materials/commodities");
}

export interface MandiComparisonItem {
  commodity: string;
  sub: string;
  local_price: string;
  local_best: boolean;
  surat_price: string;
  surat_best: boolean;
  delhi_price: string;
  delhi_best: boolean;
  action: string;
}

export async function getMandiPrices(category: string) {
  return apiGet<MandiComparisonItem[]>(`/materials/mandi?category=${encodeURIComponent(category)}`);
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
      data_source: "live" | "estimated";
      updated_at: string;
    }>;
    suppliers: Array<{
      item: string;
      lead: string;
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

export interface MandiScrapeResult {
  status: string;
  scraped_cities: string[];
  log_count: number;
  timestamp: string;
}

export async function triggerMandiScrape() {
  return apiPost<MandiScrapeResult>("/materials/trigger-mandi-scrape");
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

export interface ForecastPoint {
  date: string;
  demand: number;
  lower: number;
  upper: number;
}

export interface SeasonalPrediction {
  forecast: ForecastPoint[];
  next_festival: { name: string; date: string; days_away: number; multiplier: number } | null;
  peak_periods: { start: string; end: string; multiplier: number }[];
  has_enough_data: boolean;
  model_version: string;
  model_type: string;
  mape: number | null;
  alpha?: number;
  upgrade_available: boolean;
  records_to_upgrade: number;
}

export interface TriggerUpgradeResponse {
  upgrade_queued: boolean;
  record_count: number;
  records_needed?: number;
}

// product_id is a UUID string, not a numeric id — every other product-scoped
// call in this file takes a string id too.
export async function getSeasonalPredictions(productId: string): Promise<SeasonalPrediction> {
  return apiGet<SeasonalPrediction>(`/predictions/seasonal?product_id=${productId}`);
}

export async function triggerModelUpgrade(productId: string): Promise<TriggerUpgradeResponse> {
  return apiPost<TriggerUpgradeResponse>("/predictions/trigger-upgrade", { product_id: productId });
}

/* ---------- production ---------- */

export async function getProductionTimeline() {
  return apiGet<Record<string, unknown>[]>("/production/timeline");
}

/* ---------- advisor ---------- */

export interface AdvisorFeedNode {
  timeLabel: string;
  nodeColor: string;
  type: string;
  title: string;
  badge?: { label: string; variant: string };
  description: string;
  pills?: { label: string; variant: string }[];
  aiAdvice?: string;
  estimatedTime?: string;
  workVolume?: string;
}

export async function getAdvisorFeed(artisanId: string) {
  return apiGet<AdvisorFeedNode[]>(`/advisor/feed?artisan_id=${artisanId}`);
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

/* ---------- admin ---------- */

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  craft_type?: string;
  location?: string;
  role: string;
  is_active: boolean;
  gi_certified: boolean;
  gi_year?: string;
  product_count: number;
  created_at: string;
}

export interface AdminUsersPage {
  users: AdminUserRow[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminUserUpdate {
  is_active?: boolean;
  role?: string;
  gi_certified?: boolean;
  gi_year?: string;
}

export interface CraftTypeCount {
  craft_type: string;
  count: number;
}

export interface AdminMetrics {
  total_users: number;
  active_users: number;
  suspended_users: number;
  admin_users: number;
  signups_last_30_days: number;
  total_products: number;
  listed_products: number;
  total_orders: number;
  total_sales_value: number;
  users_by_craft_type: CraftTypeCount[];
}

export async function getAdminMetrics() {
  return apiGet<AdminMetrics>("/admin/metrics");
}

export async function getAdminUsers(search?: string, page = 1, pageSize = 20) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) params.set("search", search);
  return apiGet<AdminUsersPage>(`/admin/users?${params.toString()}`);
}

export async function updateAdminUser(userId: string, patch: AdminUserUpdate) {
  return apiPatch<AdminUserRow>(`/admin/users/${userId}`, patch);
}

export interface BulkUserUpdatePayload {
  user_ids: string[];
  is_active?: boolean;
  role?: string;
}

export interface BulkUpdateResult {
  updated: number;
  skipped: string[];
}

export async function bulkUpdateAdminUsers(data: BulkUserUpdatePayload) {
  return apiPatch<BulkUpdateResult>("/admin/users/bulk", data);
}

export interface AuditLogEntry {
  id: string;
  admin_email: string;
  target_email: string;
  action: string;
  details?: string;
  created_at: string;
}

export async function getAuditLog(targetUserId?: string, limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (targetUserId) params.set("target_user_id", targetUserId);
  return apiGet<AuditLogEntry[]>(`/admin/audit-log?${params.toString()}`);
}

export { BASE_URL };
