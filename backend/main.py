from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.gemini_service import GeminiService
import os

app = FastAPI()

# --- CORS 配置 (允许前端访问) ---
origins = [
    "http://localhost:5173",  # 本地前端开发地址
    "http://127.0.0.1:5173",
    # 未来部署后的域名也要加在这里
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 初始化服务 ---
# 注意：在生产环境中，应该更好地管理服务的生命周期
try:
    gemini_service = GeminiService()
except Exception as e:
    print(f"Warning: Gemini Service not initialized: {e}")
    gemini_service = None

# --- 数据模型 ---
class ChatRequest(BaseModel):
    message: str

# --- 接口定义 ---

@app.get("/")
def read_root():
    return {"message": "AI Mirror Backend is Running!"}

@app.post("/chat")
async def chat(request: ChatRequest):
    if not gemini_service:
        return {"reply": "Error: AI Service not configured."}
    
    # 这里暂时直接调用 Gemini，后续会加入 Memory 逻辑
    response = await gemini_service.generate_content_async(request.message)
    return {"reply": response}
    
    # --- 测试模式：绕过 Gemini ---
    # return {"reply": f"【测试模式】后端收到了你的消息：{request.message}。由于网络原因暂时无法连接 AI，但这证明前后端通信是完全正常的！"}
