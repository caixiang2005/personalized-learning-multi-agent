import { Loader2, Save } from "lucide-react";
import { motion } from "framer-motion";
import FadeInView from "../../components/motion/FadeInView";
import type { AccountFormState } from "../../hooks/useAccountPage";

type Props = {
  form: AccountFormState;
  dirty: boolean;
  saving: boolean;
  onChange: (patch: Partial<AccountFormState>) => void;
  onSubmit: () => void;
  error: string | null;
};

export default function AccountFormPanel({
  form,
  dirty,
  saving,
  onChange,
  onSubmit,
  error,
}: Props) {
  return (
    <FadeInView delay={0.12} className="account-grid__main">
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
          <h3 className="account-form__title">学习背景</h3>
          <p className="account-form__desc">用于首页引导、画像生成与路径规划</p>
        </div>

        <div className="account-fields">
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
            />
          </div>
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
              placeholder="例：学过一半，薄弱点：二叉树、图算法，偏好视频学习"
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
