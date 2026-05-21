# 用于封装大模型调用逻辑
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()
# 从环境变量中获取Deepseek API密钥
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

# 获取用户信息并回复
async def get_unlogin_reply(user_input: str) -> str:
    """
    user_input: 用户输入的文本
    return: AI回复的文本
    """

    return "ai_回复文本内容"