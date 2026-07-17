"""可选工具包。导入 get_weather 需要安装 langchain（见 requirements.txt 注释）。"""

__all__ = ["get_weather"]


def __getattr__(name: str):
    if name == "get_weather":
        from .get_weather import get_weather

        return get_weather
    raise AttributeError(name)
