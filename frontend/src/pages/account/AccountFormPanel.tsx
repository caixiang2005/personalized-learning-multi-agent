import { Loader2, Lock, Save } from "lucide-react";
import { motion } from "framer-motion";
import FadeInView from "../../components/motion/FadeInView";
import type { AccountFormState } from "../../hooks/useAccountPage";
import type { UserProfileDto } from "../../types/account";

type Props = {
  profile: UserProfileDto;
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
          <p className="account-form__desc">修改后将同步至学习画像与推荐（接口：PUT /api/user/update）</p>
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
            <label htmlFor="account-name">显示昵称</label>
            <input
              id="account-name"
              type="text"
              className="input-field"
              value={form.displayName}
              onChange={(e) => onChange({ displayName: e.target.value })}
              autoComplete="nickname"
              maxLength={32}
              placeholder="在平台内展示的名称"
            />
          </div>
        </div>

        <div className="account-form__section">
          <h3 className="account-form__subtitle">学习背景（可选）</h3>
          <p className="account-form__desc">完善后有助于生成更贴合的路径与资源</p>
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
              placeholder="例：计算机科学与技术 - 数据结构"
              maxLength={80}
            />
          </div>
          <div className="account-field">
            <label htmlFor="account-goal">学习目标</label>
            <input
              id="account-goal"
              type="text"
              className="input-field"
              value={form.goal}
              onChange={(e) => onChange({ goal: e.target.value })}
              placeholder="例：期末考 85 分以上"
              maxLength={60}
            />
          </div>
          <div className="account-field">
            <label htmlFor="account-level">当前水平与薄弱点</label>
            <textarea
              id="account-level"
              className="input-field account-field__textarea"
              value={form.level}
              onChange={(e) => onChange({ level: e.target.value })}
              placeholder="例：学过一半，薄弱点：二叉树、图算法"
              rows={3}
              maxLength={200}
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
