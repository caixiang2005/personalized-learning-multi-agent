/**
 * 个人信息页数据 Hook（useState + useEffect）
 */
import { useCallback, useEffect, useState } from "react";
import { ensureAccountMockSeed, getUserProfile, getUserStats, updateUserProfile } from "../lib/api/account";
import { ApiClientError } from "../lib/api/client";
import type { UpdateUserProfileDto, UserProfileDto, UserStatsDto } from "../types/account";

export type AccountFormState = {
  displayName: string;
  major: string;
  goal: string;
  level: string;
};

export function useAccountPage() {
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [stats, setStats] = useState<UserStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [form, setForm] = useState<AccountFormState>({
    displayName: "",
    major: "",
    goal: "",
    level: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    ensureAccountMockSeed();
    try {
      const [profileData, statsData] = await Promise.all([
        getUserProfile(),
        getUserStats(),
      ]);
      setProfile(profileData);
      setStats(statsData);
      setForm({
        displayName: profileData.displayName,
        major: profileData.major,
        goal: profileData.goal,
        level: profileData.level,
      });
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty =
    !!profile &&
    (form.displayName !== profile.displayName ||
      form.major !== profile.major ||
      form.goal !== profile.goal ||
      form.level !== profile.level);

  const save = useCallback(async () => {
    if (!dirty || saving) return false;
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const body: UpdateUserProfileDto = {
        displayName: form.displayName.trim(),
        major: form.major.trim(),
        goal: form.goal.trim(),
        level: form.level.trim(),
      };
      const updated = await updateUserProfile(body);
      setProfile(updated);
      setForm({
        displayName: updated.displayName,
        major: updated.major,
        goal: updated.goal,
        level: updated.level,
      });
      setSaveSuccess(true);
      return true;
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "保存失败");
      return false;
    } finally {
      setSaving(false);
    }
  }, [dirty, saving, form]);

  const patchForm = useCallback((patch: Partial<AccountFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSaveSuccess(false);
  }, []);

  return {
    profile,
    stats,
    form,
    loading,
    saving,
    error,
    saveSuccess,
    dirty,
    load,
    save,
    patchForm,
    setSaveSuccess,
  };
}
