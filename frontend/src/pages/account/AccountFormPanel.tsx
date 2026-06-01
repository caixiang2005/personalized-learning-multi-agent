import { Loader2, Lock, Save } from "lucide-react";
import { motion } from "framer-motion";
import FadeInView from "../../components/motion/FadeInView";
import type { AccountFormState } from "../../hooks/useAccountPage";
import type { AccountProfileView } from "../../types/account";

type Props = {
  profile: AccountProfileView;
  form: AccountFormState;
  dirty: boolean;
  saving: boolean;
  onChange: (patch: Partial<AccountFormState>) => void;
  onSubmit: () => void;
  error: string | null;
};

export default function AccountFormPanel({
  profile,
  form,
  dirty,
  saving,
  onChange,
  onSubmit,
  error,
}: Props) {
  return (
    <FadeInView delay={0.1} className="account-grid__main">
      <motion.form
        className="account-form section-card"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        layout
        noValidate
      >
        <div className="account-form__head">
          <h2 className="account-form__title">编辑资料</h2>
          <p className="account-form__desc">修改后将同步至 user_info（接口：POST /api/user/updateProfile）</p>
        </div>

        <div className="account-fields">
          <div className="account-field">
            <label htmlFor="account-username">
              用户名
              <span className="account-field__hint">
                <Lock size={12} strokeWidth={1.75} />
                不可修改
              </span>
            </label>
            <input
              id="account-username"
              type="text"
              className="input-field input-field--readonly"
              value={profile.username}
              readOnly
              aria-readonly="true"
            />
          </div>

          <div className="account-field">
            <label htmlFor="account-email">登录邮箱</label>
            <input
              id="account-email"
              type="email"
              className="input-field input-field--readonly"
              value={profile.email}
              readOnly
              aria-readonly="true"
            />
          </div>

          <div className="account-field">
            <label htmlFor="account-name">昵称</label>
            <input
              id="account-name"
              type="text"
              className="input-field"
              value={form.nickname}
              onChange={(e) => onChange({ nickname: e.target.value })}
              autoComplete="nickname"
              maxLength={32}
              placeholder="在平台内展示的名称"
            />
          </div>
        </div>

        <div className="account-fields">
          <div className="account-field">
            <label htmlFor="account-major">专业 / 课程方向</label>
            <input
              id="account-major"
              type="text"
              className="input-field"
              value={form.major}
              onChange={(e) => onChange({ major: e.target.value })}
              placeholder="例：计算机科学"
              maxLength={32}
            />
          </div>
          <div className="account-field">
            <label htmlFor="account-signature">个性签名</label>
            <textarea
              id="account-signature"
              className="input-field account-field__textarea"
              value={form.signature}
              onChange={(e) => onChange({ signature: e.target.value })}
              placeholder="写一句介绍自己的话…"
              rows={3}
              maxLength={100}
            />
          </div>
        </div>

        {error && (
          <motion.p
            className="account-tip account-tip--error mt-3"
            role="alert"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}

        <div className="account-form__foot">
          <motion.button
            type="submit"
            className="btn-primary account-save-btn cursor-pointer"
            disabled={saving || !dirty}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                保存中…
              </>
            ) : (
              <>
                <Save size={16} strokeWidth={1.75} />
                保存更改
              </>
            )}
          </motion.button>
        </div>
      </motion.form>
    </FadeInView>
  );
}
