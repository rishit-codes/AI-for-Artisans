import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  updateProfile, getAdvisorRecommendations, getPlan, addPlanItem, removePlanItem,
  AdvisorRecommendation, PlanItem,
} from "@/lib/api";

export type Skill = "beginner" | "intermediate" | "established";
export type Goal = "income" | "festival" | "export" | "learning";

export type AdvisorProfile = {
  skill: Skill;
  equipment: number;
  yearsPracticing: number;
  capacity: number;
  goal: Goal;
};

interface ParsedBio {
  advisorProfile?: AdvisorProfile;
  [key: string]: unknown;
}

const parseBio = (bio: unknown): ParsedBio => {
  if (typeof bio !== "string" || !bio) return {};
  try {
    return JSON.parse(bio) as ParsedBio;
  } catch {
    return {};
  }
};

export const useAdvisor = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [capacityOverride, setCapacityOverride] = useState<number | null>(null);

  const parsedBio = parseBio(user?.bio);
  const profile: AdvisorProfile | null = parsedBio.advisorProfile ?? null;
  const capacity = capacityOverride ?? profile?.capacity ?? 20;

  const setProfile = useCallback(async (p: AdvisorProfile) => {
    const newBio = JSON.stringify({ ...parsedBio, advisorProfile: p });
    await updateProfile({ bio: newBio });
    updateUser({ bio: newBio });
    queryClient.invalidateQueries({ queryKey: ["advisorRecommendations"] });
  }, [parsedBio, updateUser, queryClient]);

  const clearProfile = useCallback(async () => {
    const { advisorProfile: _drop, ...rest } = parsedBio;
    const newBio = JSON.stringify(rest);
    await updateProfile({ bio: newBio });
    updateUser({ bio: newBio });
  }, [parsedBio, updateUser]);

  const { data: recommendationsData, isLoading: isRecommendationsLoading } = useQuery({
    queryKey: ["advisorRecommendations", capacity],
    queryFn: () => getAdvisorRecommendations(capacity),
    enabled: !!profile,
  });

  const { data: plan = [], isLoading: isPlanLoading } = useQuery({
    queryKey: ["advisorPlan"],
    queryFn: getPlan,
    enabled: !!profile,
  });

  const addMutation = useMutation({
    mutationFn: (item: { product_id: string; quantity: number; week: number }) => addPlanItem(item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["advisorPlan"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removePlanItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["advisorPlan"] }),
  });

  const addToPlan = useCallback((rec: AdvisorRecommendation) => {
    if (plan.find((p) => p.product_id === rec.product_id)) return;
    const week = (plan.length % 4) + 1;
    addMutation.mutate({ product_id: rec.product_id, quantity: rec.suggested_batch, week });
  }, [plan, addMutation]);

  const removeFromPlan = useCallback((itemId: string) => {
    removeMutation.mutate(itemId);
  }, [removeMutation]);

  return {
    profile, setProfile, clearProfile,
    capacity, setCapacityOverride,
    recommendations: (recommendationsData?.recommendations ?? []) as AdvisorRecommendation[],
    materials: recommendationsData?.materials ?? [],
    recentPace: recommendationsData?.recent_pace ?? null,
    isRecommendationsLoading,
    plan: plan as PlanItem[],
    isPlanLoading,
    addToPlan, removeFromPlan,
  };
};
