"""
拍照搜题 API：上传图片 + 可选文字 → AI 分析
"""
from fastapi import APIRouter, File, Form, UploadFile
from services.ocr_service import analyze_question

router = APIRouter(tags=["拍照搜题"])


@router.post("/api/agent/scan")
async def scan_image(
    file: UploadFile = File(...),
    text: str = Form(""),
):
    """上传题目图片 + 可选手动输入文字，AI 分析"""
    if not file.content_type or not file.content_type.startswith("image/"):
        return {"code": 400, "msg": "请上传图片文件", "data": {}}

    try:
        image_bytes = await file.read()
    except Exception:
        return {"code": 400, "msg": "读取图片失败", "data": {}}

    if not image_bytes:
        return {"code": 400, "msg": "图片为空", "data": {}}

    if len(image_bytes) > 10 * 1024 * 1024:
        return {"code": 400, "msg": "图片大小不能超过 10MB", "data": {}}

    return await analyze_question(image_bytes, text or "")
