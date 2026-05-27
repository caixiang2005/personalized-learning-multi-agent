import os

import httpx
from langchain.tools import tool

from services.logger import logger

AMAP_API_KEY = os.getenv("AMAP_API_KEY")
AMAP_WEATHER_URL = "https://restapi.amap.com/v3/weather/weatherInfo"


@tool
def get_weather(city: str) -> str:
    """查询指定城市的实时天气情况"""
    if not AMAP_API_KEY:
        logger.error("[CONFIG_ERROR] AMAP_API_KEY 未配置")
        return "服务配置错误，请联系管理员。"

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(
                AMAP_WEATHER_URL,
                params={
                    "key": AMAP_API_KEY,
                    "city": city,
                    "extensions": "base",
                },
            )
            data = resp.json()

        if data.get("status") != "1" or not data.get("lives"):
            logger.error("[AMAP_API_ERR] 高德返回异常: %s", data)
            return f"未查到「{city}」的天气信息"

        live = data["lives"][0]
        return (
            f"{live['city']} 实时天气："
            f"{live['weather']}，"
            f"温度 {live['temperature']}℃，"
            f"湿度 {live['humidity']}%，"
            f"{live['winddirection']}风 {live['windpower']}级"
        )

    except httpx.TimeoutException:
        logger.error("[AMAP_TIMEOUT] 高德天气 API 超时")
        return "天气查询超时，请稍后再试"
    except Exception as e:
        logger.error("[AMAP_API_ERR] 高德天气 API 异常: %s", e)
        return "天气查询失败，请稍后再试"
