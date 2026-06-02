/**
 * 个人信息页 · 对接 user_info API
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAccountProfile,
  getUserStats,
  updateAccountProfile,
  uploadAccountAvatar,
} from "../lib/api/account";
import { validateAvatarFile } from "../lib/avatar";
import { ApiClientError } from "../lib/api/client";
import { useAppStore } from "../store/useAppStore";
import type { AccountProfileView, UpdateProfileBody, UserStatsDto } from "../types/account";

export type AccountFormState = {
  nickname: string;
  phoneNumber: string;
  gender: string;
  birthday: string;
  signature: string;
  major: string;
};

function toForm(profile: AccountProfileView): AccountFormState {
  return {
    nickname: profile.nickname ?? "",
    phoneNumber: profile.phoneNumber ?? "",
    gender: profile.gender == null ? "" : String(profile.gender),
    birthday: profile.birthday ?? "",
    signature: profile.signature ?? "",
    major: profile.major ?? "",
  };
}

function buildUpdateBody(
  form: AccountFormState,
  profile: AccountProfileView
): UpdateProfileBody | null {
  const body: UpdateProfileBody = {};

  const nick = form.nickname.trim();
  if (nick !== (profile.nickname ?? "")) {
    body.nickname = nick || null;
  }

  const phone = form.phoneNumber.trim();
  if (phone !== (profile.phoneNumber ?? "")) {
    body.phoneNumber = phone || null;
  }

  const genderNum = form.gender === "" ? null : Number(form.gender);
  if (genderNum !== profile.gender) {
    body.gender = genderNum;
  }

  const bday = form.birthday.trim();
  if (bday !== (profile.birthday ?? "")) {
    body.birthday = bday || null;
  }

  const sig = form.signature.trim();
  if (sig !== (profile.signature ?? "")) {
    body.signature = sig || null;
  }

  const major = form.major.trim();
  if (major !== (profile.major ?? "")) {
    body.major = major || null;
  }

  return Object.keys(body).length > 0 ? body : null;
}

export function useAccountPage() {
  const [profile, setProfile] = useState<AccountProfileView | null>(null);
  const [stats, setStats] = useState<UserStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);

  const [form, setForm] = useState<AccountFormState>({
    nickname: "",
    phoneNumber: "",
    gender: "",
    birthday: "",
    signature: "",
    major: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, statsData] = await Promise.all([
        getAccountProfile(),
        getUserStats(),
      ]);
      setProfile(profileData);
      setStats(statsData);
      setForm(toForm(profileData));
      useAppStore.getState().setUserAvatar(profileData.avatarUrl);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => {
    if (!profile) return false;
    return buildUpdateBody(form, profile) !== null;
  }, [form, profile]);

  const save = useCallback(async () => {
    if (!profile || !dirty || saving) return false;
    const body = buildUpdateBody(form, profile);
    if (!body) return false;

    if (body.phoneNumber && !/^1\d{10}$/.test(body.phoneNumber)) {
      setError("手机号格式错误，需为 11 位大陆手机号");
      return false;
    }

    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const updated = await updateAccountProfile(body);
      setProfile(updated);
      setForm(toForm(updated));
      setSaveSuccess(true);
      return true;
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "保存失败");
      return false;
    } finally {
      setSaving(false);
    }
  }, [profile, dirty, saving, form]);

  const uploadAvatar = useCallback(
    async (file: File) => {
      const invalid = validateAvatarFile(file);
      if (invalid) {
        setError(invalid);
        return false;
      }

      setUploadingAvatar(true);
      setError(null);
      try {
        const avatarUrl = await uploadAccountAvatar(file);
        setProfile((p) => (p ? { ...p, avatarUrl } : p));
        setAvatarVersion((v) => v + 1);
        setSaveSuccess(true);
        return true;
      } catch (e) {
        setError(e instanceof ApiClientError ? e.message : "头像上传失败");
        return false;
      } finally {
        setUploadingAvatar(false);
      }
    },
    []
  );

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
    uploadingAvatar,
    error,
    saveSuccess,
    dirty,
    avatarVersion,
    load,
    save,
    uploadAvatar,
    patchForm,
    setError,
    setSaveSuccess,
  };
}
