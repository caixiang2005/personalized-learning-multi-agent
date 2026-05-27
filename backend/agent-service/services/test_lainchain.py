from langchain.tools import tool

@tool
def get_weather(city: str) -> str:
    """获取指定城市的天气信息"""
    # 这里可以调用实际的天气API来获取数据
    return f"{city} 的天气是晴朗，温度25摄氏度。"