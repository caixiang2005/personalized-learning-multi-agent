from app import create_app
from sendRegEmailCode import router as email_router  # 现在正确了

app = create_app()
app.include_router(email_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)