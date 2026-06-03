import { useRef } from "react";
import { Camera, ImagePlus, Upload } from "lucide-react";

type Props = {
  preview: string | null;
  disabled?: boolean;
  onFile: (file: File) => void;
};

export default function ScanUploadZone({ preview, disabled, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (file?: File) => {
    if (!file || disabled) return;
    if (!file.type.startsWith("image/")) return;
    onFile(file);
  };

  return (
    <div className="scholar-card p-5 md:p-6">
      <div
        className={`relative flex flex-col items-center justify-center gap-3 rounded-[var(--scholar-radius-md)] border-2 border-dashed border-[var(--scholar-border)] bg-[color-mix(in_srgb,var(--scholar-primary)_3%,var(--scholar-card))] min-h-[220px] overflow-hidden transition-colors ${
          disabled ? "opacity-60 pointer-events-none" : "hover:border-[var(--scholar-primary)] cursor-pointer"
        }`}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="上传或拍摄题目图片"
      >
        {preview ? (
          <img src={preview} alt="题目预览" className="max-h-52 w-full object-contain p-2" />
        ) : (
          <>
            <div className="flex gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--scholar-primary)_12%,transparent)] text-[var(--scholar-primary)]">
                <Camera size={22} strokeWidth={1.75} />
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--scholar-accent)_12%,transparent)] text-[var(--scholar-accent)]">
                <ImagePlus size={22} strokeWidth={1.75} />
              </span>
            </div>
            <p className="text-sm font-medium text-[var(--scholar-text)]">点击上传或拍照搜题</p>
            <p className="text-xs text-[var(--scholar-text-muted)]">支持 JPG / PNG · 单题识别</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {preview && !disabled && (
        <button
          type="button"
          className="mt-3 btn-secondary w-full text-sm py-2 inline-flex items-center justify-center gap-2 cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={16} />
          重新选择图片
        </button>
      )}
    </div>
  );
}
