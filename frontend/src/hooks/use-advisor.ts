import { useCallback, useEffect, useMemo, useState } from "react";
import { Cluster, RECOMMENDATIONS, Recommendation } from "@/data/advisorRecommendations";

export type Skill = "beginner" | "intermediate" | "established";
export type Goal = "income" | "festival" | "export" | "learning";

export type AdvisorProfile = {
  cluster: Cluster;
  skill: Skill;
  equipment: number;
  yearsPracticing: number;
  capacity: number; // units/week
  goal: Goal;
};

const PROFILE_KEY = "advisor.profile";
const PLAN_KEY = "advisor.plan";

export type PlannedBatch = { recId: string; week: number; quantity: number };

const readJSON = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const useAdvisor = () => {
  const [profile, setProfileState] = useState<AdvisorProfile | null>(() => readJSON<AdvisorProfile | null>(PROFILE_KEY, null));
  const [plan, setPlanState] = useState<PlannedBatch[]>(() => readJSON<PlannedBatch[]>(PLAN_KEY, []));
  const [capacityOverride, setCapacityOverride] = useState<number | null>(null);

  useEffect(() => {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);
  useEffect(() => {
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  }, [plan]);

  const setProfile = useCallback((p: AdvisorProfile) => setProfileState(p), []);
  const clearProfile = useCallback(() => {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(PLAN_KEY);
    setProfileState(null);
    setPlanState([]);
  }, []);

  const capacity = capacityOverride ?? profile?.capacity ?? 30;

  const recommendations = useMemo<Recommendation[]>(() => {
    if (!profile) return [];
    const all = RECOMMENDATIONS.filter((r) => r.cluster === profile.cluster);
    // Score by confidence + trend + skill fit
    const scored = all
      .map((r) => {
        let score = r.confidence + r.trend * 0.5;
        if (profile.skill === "beginner" && r.leadDays > 12) score -= 20;
        if (profile.goal === "festival" && r.festival !== "Year-round") score += 8;
        if (profile.goal === "export" && r.festival === "Export-Holiday") score += 14;
        return { r, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((s) => s.r);
    // Scale batch sizes to capacity
    return scored.map((rec) => ({
      ...rec,
      baseBatch: Math.max(2, Math.round((rec.baseBatch * capacity) / 30)),
    }));
  }, [profile, capacity]);

  const addToPlan = useCallback((recId: string) => {
    setPlanState((prev) => {
      if (prev.find((p) => p.recId === recId)) return prev;
      const week = (prev.length % 4) + 1;
      const rec = RECOMMENDATIONS.find((r) => r.id === recId);
      const quantity = rec ? Math.max(2, Math.round((rec.baseBatch * capacity) / 30)) : 10;
      return [...prev, { recId, week, quantity }];
    });
  }, [capacity]);

  const removeFromPlan = useCallback((recId: string) => {
    setPlanState((prev) => prev.filter((p) => p.recId !== recId));
  }, []);

  return {
    profile, setProfile, clearProfile,
    capacity, setCapacityOverride,
    recommendations,
    plan, addToPlan, removeFromPlan,
  };
};
