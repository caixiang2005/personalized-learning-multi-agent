from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(tags=["内容安全"])

_BLOCKED_KEYWORDS = ("作弊", "代考", "答案泄露", "枪手", "替考")


class SafetyCheckBody(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


@router.post("/api/safety/check")
def check_safety(body: SafetyCheckBody):
    text = body.text.strip()
    for keyword in _BLOCKED_KEYWORDS:
        if keyword in text:
            return {
                "code": 200,
                "msg": "检测完成",
                "data": {
                    "safe": False,
                    "hit": keyword,
                    "message": f"输入包含敏感词「{keyword}」，请修改后重试",
                },
            }
    return {"code": 200, "msg": "检测完成", "data": {"safe": True}}
