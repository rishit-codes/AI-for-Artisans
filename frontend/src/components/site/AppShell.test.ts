import { describe, it, expect } from "vitest";
import { parseNotificationPrefs } from "./AppShell";

describe("parseNotificationPrefs", () => {
  it("returns defaults (all on) when bio is missing", () => {
    expect(parseNotificationPrefs(undefined)).toEqual({ orders: true, mandi: true, festival: true });
  });

  it("returns defaults when bio isn't valid JSON", () => {
    expect(parseNotificationPrefs("not json")).toEqual({ orders: true, mandi: true, festival: true });
  });

  it("returns defaults when bio JSON has no notificationPrefs key", () => {
    expect(parseNotificationPrefs(JSON.stringify({ phone: "123" }))).toEqual({ orders: true, mandi: true, festival: true });
  });

  it("merges stored prefs over the defaults", () => {
    const bio = JSON.stringify({ notificationPrefs: { orders: false } });
    expect(parseNotificationPrefs(bio)).toEqual({ orders: false, mandi: true, festival: true });
  });

  it("respects all three toggled off", () => {
    const bio = JSON.stringify({ notificationPrefs: { orders: false, mandi: false, festival: false } });
    expect(parseNotificationPrefs(bio)).toEqual({ orders: false, mandi: false, festival: false });
  });
});
