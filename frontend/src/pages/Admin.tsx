import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users, ShieldCheck, UserX, Award, Package2, ShoppingBag,
  IndianRupee, Search, ChevronLeft, ChevronRight, Loader2, ShieldOff, History,
} from "lucide-react";
import AppShell from "@/components/site/AppShell";
import { useAuth } from "@/hooks/use-auth";
import {
  getAdminMetrics, getAdminUsers, updateAdminUser, AdminUserRow, AdminUserUpdate,
  bulkUpdateAdminUsers, getAuditLog,
} from "@/lib/api";

const PAGE_SIZE = 20;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const StatCard = ({ icon: Icon, label, value, hindi }: { icon: typeof Users; label: string; value: string | number; hindi?: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon size={14} />
      <span className="text-[10px] uppercase tracking-wider font-data">{label}</span>
    </div>
    <div className="font-display text-3xl mt-2">{value}</div>
    {hindi && <div className="text-[10px] text-muted-foreground font-hindi mt-0.5">{hindi}</div>}
  </div>
);

const Admin = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAuditLog, setShowAuditLog] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["adminMetrics"],
    queryFn: getAdminMetrics,
  });

  const { data: usersPage, isLoading: usersLoading } = useQuery({
    queryKey: ["adminUsers", search, page],
    queryFn: () => getAdminUsers(search, page, PAGE_SIZE),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: AdminUserUpdate }) => updateAdminUser(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update user."),
  });

  const bulkMutation = useMutation({
    mutationFn: bulkUpdateAdminUsers,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      setSelected(new Set());
      toast.success(`Updated ${result.updated} user${result.updated === 1 ? "" : "s"}.${result.skipped.length ? ` Skipped: ${result.skipped.join(", ")}` : ""}`);
    },
    onError: (e: Error) => toast.error(e.message || "Bulk update failed."),
  });

  const { data: auditLog, isLoading: auditLoading } = useQuery({
    queryKey: ["adminAuditLog"],
    queryFn: () => getAuditLog(),
    enabled: showAuditLog,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const toggleRole = (row: AdminUserRow) => {
    const nextRole = row.role === "admin" ? "user" : "admin";
    updateMutation.mutate({ id: row.id, patch: { role: nextRole } });
  };

  const toggleActive = (row: AdminUserRow) => {
    updateMutation.mutate({ id: row.id, patch: { is_active: !row.is_active } });
  };

  const toggleGiCertified = (row: AdminUserRow) => {
    updateMutation.mutate({ id: row.id, patch: { gi_certified: !row.gi_certified } });
  };

  const totalPages = usersPage ? Math.max(1, Math.ceil(usersPage.total / PAGE_SIZE)) : 1;

  return (
    <AppShell title="Admin" hindi="व्यवस्थापक" subtitle="Platform-wide user management and metrics.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total users" value={metricsLoading ? "…" : metrics?.total_users ?? 0} />
        <StatCard icon={ShieldCheck} label="Active" value={metricsLoading ? "…" : metrics?.active_users ?? 0} />
        <StatCard icon={UserX} label="Suspended" value={metricsLoading ? "…" : metrics?.suspended_users ?? 0} />
        <StatCard icon={ShieldCheck} label="Admins" value={metricsLoading ? "…" : metrics?.admin_users ?? 0} />
        <StatCard icon={Package2} label="Products listed" value={metricsLoading ? "…" : `${metrics?.listed_products ?? 0}/${metrics?.total_products ?? 0}`} />
        <StatCard icon={ShoppingBag} label="Total orders" value={metricsLoading ? "…" : metrics?.total_orders ?? 0} />
        <StatCard icon={IndianRupee} label="Order value" value={metricsLoading ? "…" : inr(metrics?.total_sales_value ?? 0)} />
        <StatCard icon={Users} label="Signups · 30d" value={metricsLoading ? "…" : metrics?.signups_last_30_days ?? 0} />
      </div>

      {metrics && metrics.users_by_craft_type.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-data mb-3">Users by craft type</div>
          <div className="flex flex-wrap gap-2">
            {metrics.users_by_craft_type.map((c) => (
              <span key={c.craft_type} className="text-xs px-3 py-1.5 rounded-full bg-muted font-data">
                {c.craft_type} · {c.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {showAuditLog && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <div className="font-display text-xl">Audit log</div>
              <div className="text-xs font-hindi text-muted-foreground">व्यवस्थापक कार्रवाई लॉग</div>
            </div>
            <button onClick={() => setShowAuditLog(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
          </div>
          {auditLoading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" /> Loading audit log…
            </div>
          ) : !auditLog || auditLog.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No admin actions recorded yet.</div>
          ) : (
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {auditLog.map((entry) => (
                <div key={entry.id} className="px-5 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span><span className="font-medium">{entry.admin_email}</span> — {entry.action.replace("_", " ")} — <span className="font-medium">{entry.target_email}</span></span>
                    <span className="text-[10px] text-muted-foreground font-data shrink-0">{new Date(entry.created_at).toLocaleString("en-IN")}</span>
                  </div>
                  {entry.details && <div className="text-xs text-muted-foreground font-data mt-1">{entry.details}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-display text-xl">Users</div>
            <div className="text-xs font-hindi text-muted-foreground">सभी उपयोगकर्ता</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAuditLog((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted"
            >
              <History size={13} /> Audit log
            </button>
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 border border-border rounded-full px-3 py-1.5 bg-background/60 w-full sm:w-72">
              <Search size={14} className="text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email…"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              />
            </form>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="px-5 py-3 border-b border-border bg-primary/5 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-data">{selected.size} selected</span>
            <div className="flex items-center gap-2">
              <button
                disabled={bulkMutation.isPending}
                onClick={() => bulkMutation.mutate({ user_ids: Array.from(selected), role: "admin" })}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted disabled:opacity-40"
              >
                Promote all
              </button>
              <button
                disabled={bulkMutation.isPending}
                onClick={() => bulkMutation.mutate({ user_ids: Array.from(selected), role: "user" })}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted disabled:opacity-40"
              >
                Demote all
              </button>
              <button
                disabled={bulkMutation.isPending}
                onClick={() => bulkMutation.mutate({ user_ids: Array.from(selected), is_active: false })}
                className="text-xs px-3 py-1.5 rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10 disabled:opacity-40"
              >
                Suspend all
              </button>
              <button
                disabled={bulkMutation.isPending}
                onClick={() => bulkMutation.mutate({ user_ids: Array.from(selected), is_active: true })}
                className="text-xs px-3 py-1.5 rounded-full border border-forest/30 text-forest hover:bg-forest/10 disabled:opacity-40"
              >
                Reactivate all
              </button>
            </div>
          </div>
        )}

        {usersLoading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> Loading users…
          </div>
        ) : !usersPage || usersPage.users.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No users match this search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-data border-b border-border">
                  <th className="py-3 pl-5 pr-2 font-normal w-8">
                    <input
                      type="checkbox"
                      checked={usersPage.users.length > 0 && usersPage.users.every((u) => selected.has(u.id))}
                      onChange={(e) => {
                        const next = new Set(selected);
                        usersPage.users.forEach((u) => e.target.checked ? next.add(u.id) : next.delete(u.id));
                        setSelected(next);
                      }}
                    />
                  </th>
                  <th className="py-3 px-3 font-normal">User</th>
                  <th className="py-3 px-3 font-normal">Craft</th>
                  <th className="py-3 px-3 font-normal">Role</th>
                  <th className="py-3 px-3 font-normal">Status</th>
                  <th className="py-3 px-3 font-normal">GI cert</th>
                  <th className="py-3 px-3 font-normal text-right">Products</th>
                  <th className="py-3 px-5 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersPage.users.map((row) => {
                  const isSelf = row.id === (currentUser?.id as unknown as string);
                  return (
                    <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-background transition-colors">
                      <td className="py-3.5 pl-5 pr-2">
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          disabled={isSelf}
                          onChange={(e) => {
                            const next = new Set(selected);
                            if (e.target.checked) next.add(row.id);
                            else next.delete(row.id);
                            setSelected(next);
                          }}
                        />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-medium">{row.full_name}</div>
                        <div className="text-xs text-muted-foreground">{row.email}</div>
                      </td>
                      <td className="py-3.5 px-3 text-muted-foreground">{row.craft_type || "—"}</td>
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-data font-bold ${row.role === "admin" ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"}`}>
                          {row.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-data font-bold ${row.is_active ? "bg-forest/10 text-forest" : "bg-destructive/10 text-destructive"}`}>
                          {row.is_active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => toggleGiCertified(row)}
                          disabled={updateMutation.isPending}
                          className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-data font-bold inline-flex items-center gap-1 transition-colors ${row.gi_certified ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground hover:bg-border-strong/40"}`}
                        >
                          <Award size={11} /> {row.gi_certified ? (row.gi_year ? `Certified · ${row.gi_year}` : "Certified") : "Not certified"}
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-right font-data">{row.product_count}</td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleRole(row)}
                            disabled={updateMutation.isPending || isSelf}
                            title={isSelf ? "You can't change your own role" : undefined}
                            className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {row.role === "admin" ? "Demote" : "Promote"}
                          </button>
                          <button
                            onClick={() => toggleActive(row)}
                            disabled={updateMutation.isPending || isSelf}
                            title={isSelf ? "You can't suspend your own account" : undefined}
                            className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${row.is_active ? "border-destructive/30 text-destructive hover:bg-destructive/10" : "border-forest/30 text-forest hover:bg-forest/10"}`}
                          >
                            {row.is_active ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
                            {row.is_active ? "Suspend" : "Reactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {usersPage && usersPage.total > PAGE_SIZE && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs font-data text-muted-foreground">
            <span>{usersPage.total} user{usersPage.total === 1 ? "" : "s"} · page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-full border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-full border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Admin;
