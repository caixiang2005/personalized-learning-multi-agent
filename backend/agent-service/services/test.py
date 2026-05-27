import sys
from pathlib import Path

# 把项目根目录加入 Python 路径，确保导入正常
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv()

from langchain.agents import create_agent
from tools import get_weather

agent = create_agent(
    'deepseek-chat',
    tools=[get_weather]
)

if __name__ == "__main__":
    response = agent.invoke({
        "messages": [
            {"role": "user", "content": "今天九江天气如何"},
        ]
    })
    print(response)
