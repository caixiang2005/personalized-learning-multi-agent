# 导入FastAPI核心
from fastapi import FastAPI

# 创建应用实例
app = FastAPI(title="用户微服务-极简版")

# 根接口：访问就返回一句话（最简单输出）
@app.get("/")
def index():
    return {"message": "用户服务启动成功！user-service 运行中 ~"}

# 健康检查接口
@app.get("/health")
def health():
    return {"status": "正常", "service": "user-service"}