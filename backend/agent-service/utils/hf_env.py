"""HuggingFace 镜像与 embedding 模型加载（须在 import SentenceTransformer 之前配置环境变量）。"""
from __future__ import annotations

import os
from pathlib import Path


def configure_hf_mirror() -> str:
    """配置国内镜像，避免默认连 huggingface.co 超时。"""
    mirror = (os.getenv("HF_ENDPOINT") or "https://hf-mirror.com").rstrip("/")
    os.environ["HF_ENDPOINT"] = mirror
    os.environ["HUGGINGFACE_HUB_BASE_URL"] = mirror
    return mirror


def find_cached_snapshot(model_name: str) -> Path | None:
    folder = "models--" + model_name.replace("/", "--")
    hub_root = Path(os.getenv("HF_HOME", Path.home() / ".cache" / "huggingface")) / "hub"
    snapshots_dir = hub_root / folder / "snapshots"
    if not snapshots_dir.is_dir():
        return None
    candidates = [p for p in snapshots_dir.iterdir() if p.is_dir()]
    if not candidates:
        return None
    return max(candidates, key=lambda p: p.stat().st_mtime)


def load_sentence_transformer(model_name: str, local_path: str | None = None):
    configure_hf_mirror()
    from sentence_transformers import SentenceTransformer

    if local_path:
        return SentenceTransformer(local_path)

    cached = find_cached_snapshot(model_name)
    if cached is not None:
        try:
            return SentenceTransformer(str(cached))
        except Exception:
            pass

    return SentenceTransformer(model_name)
