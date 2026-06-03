/**
 * 个人信息 · user_info 接口类型
 * @see backend user-info-api.md
 */

/** GET getProfile / POST updateProfile 成功时的 data */
export interface UserProfileData {
  userId: number;
  username: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  gender: number | null;
  birthday: string | null;
  lastLoginTime: string | null;
  signature: string | null;
  major: string | null;
  nickname: string | null;
}

/** POST updateProfile 请求体（部分更新） */
export interface UpdateProfileBody {
  phoneNumber?: string | null;
  gender?: number | null;
  birthday?: string | null;
  signature?: string | null;
  major?: string | null;
  nickname?: string | null;
}

/** POST uploadAvatar 成功时的 data */
export interface UploadAvatarData {
  avatarUrl: string;
}

/** 页面展示：user_info + getUserInfo */
export interface AccountProfileView extends UserProfileData {
  email: string;
  registerTime: string | null;
}

/** 统一 API 响应壳 */
export interface ApiEnvelope<T> {
  code: number;
  msg: string;
  data: T;
}

/** GET /api/user/stats（若后端未实现可继续 mock） */
export interface UserStatsDto {
  healthScore: number;
  goalProgress: number;
  pathProgress: number;
  sessionCount: number;
}
