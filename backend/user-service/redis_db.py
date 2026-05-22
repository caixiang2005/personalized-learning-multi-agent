import redis
import os
from dotenv import load_dotenv

load_dotenv()

redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST"),
    port=int(os.getenv("REDIS_PORT")),
    db=int(os.getenv("REDIS_DB")),
    decode_responses=True
)

def has_email_code(email: str) -> bool:
    """
    检查该邮箱是否已经存在未过期的注册验证码
    返回 True = 有（不能重复发）
    返回 False = 没有（可以发送）
    """
    key = f"register:code:{email}"
    return redis_client.exists(key) == 1

if __name__ == "__main__":
    try:
        redis_client.ping()
        print("Redis 连接成功")
        
        # 测试是否已有验证码
        email = "2179451926@qq.com"
        print(has_email_code(email))  # True / False
        
    except redis.ConnectionError:
        print("Redis 连接失败")