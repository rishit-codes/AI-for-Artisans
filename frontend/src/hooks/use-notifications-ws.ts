import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BASE_URL } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface WsNotification {
  type: "new_order" | "order_paid" | "order_status";
  message: string;
  order_id: string;
  status?: string;
}

// Real-time push over /ws/notifications — new marketplace orders, payments,
// and status changes land here instead of waiting for the next react-query
// poll. Mounted once, app-wide, from App.tsx (not AppShell — Dashboard.tsx
// predates AppShell and uses its own layout, so anything mounted inside
// AppShell would miss the app's actual home page).
export const useNotificationsWs = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) return;

    let closedByUs = false;
    let socket: WebSocket | null = null;
    let connectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      const wsUrl = `${BASE_URL.replace(/^http/, "ws")}/ws/notifications?token=${encodeURIComponent(token)}`;
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        let data: WsNotification;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        toast.info(data.message);
        if (data.type === "new_order" || data.type === "order_paid") {
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
          queryClient.invalidateQueries({ queryKey: ["dashboardPriority"] });
        } else if (data.type === "order_status") {
          queryClient.invalidateQueries({ queryKey: ["myPurchases"] });
        }
      };

      socket.onclose = () => {
        if (closedByUs) return;
        // Connection dropped (server restart, network blip) — retry once
        // the dust settles rather than leaving the user silently offline.
        reconnectTimer.current = setTimeout(connect, 3000);
      };
    };

    // Deferred by a tick so React 18 StrictMode's dev-only immediate
    // mount→cleanup→remount cancels this timer before a real socket is ever
    // created for the phantom mount — opening and instantly aborting a
    // WebSocket can trip Chromium's reconnect-storm throttling, delaying the
    // real connection's handshake by several seconds. With the defer, only
    // the surviving (remounted) effect's timer actually fires, so exactly
    // one socket opens per mount.
    connectTimer = setTimeout(connect, 0);

    return () => {
      closedByUs = true;
      if (connectTimer) clearTimeout(connectTimer);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      socket?.close();
    };
  }, [token, queryClient]);
};
