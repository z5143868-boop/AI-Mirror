from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict
import uuid
import json
import asyncio

from services.gemini_service import GeminiService
from services.chat_service import ChatService
from store import store
from models import UserProfile, AnchorStatus, PsychProfile, InteractionLog, AnalysisReport
from dto import (
    OnboardingRequest, ChatRequest, ScenarioRequest, ReportRequest,
    MBTIQuizRequest, MBTISubmitRequest, MBTIQuizAnswerRequest,
    TagCloudRequest, TagCloudSelectRequest, ShadowWorkRequest, ShadowWorkSubmitRequest
)

app = FastAPI(root_path="/api")

# --- CORS ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://ai-mirror-psi.vercel.app",
    "https://ai-mirror-*-theos-projects-6eb0b9cb.vercel.app", # Wildcard for preview deployments
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for simplicity in this stage, or use the list above if preferred strictness
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Services ---
try:
    chat_service = ChatService()
    gemini_service = GeminiService()
except Exception as e:
    print(f"Warning: Services not initialized: {e}")
    chat_service = None
    gemini_service = None

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "AI Mirror Backend is Running!", "status": "ok"}

# --- Stage 0: Anchor Status (Refactored Onboarding) ---

@app.post("/onboarding")
def onboarding(req: OnboardingRequest):
    """
    Stage 0: 锚定现状 (Anchor Status)
    初始化用户档案，对应 PRD Stage 0
    """
    user_id = str(uuid.uuid4())
    profile_id = str(uuid.uuid4())
    
    # Map request to new AnchorStatus model
    anchor_status = AnchorStatus(
        gender=req.gender,
        age_group=str(req.age),
        occupation=req.job,
        financial_status=req.income,
        core_trouble=req.core_trouble
    )
    
    # Legacy BasicInfo for compatibility
    basic_info = {
        "nickname": req.nickname,
        "age": req.age,
        "job": req.job,
        "income": req.income,
        "gender": req.gender
    }
    
    profile = UserProfile(
        profile_id=profile_id,
        user_id=user_id,
        static_data=anchor_status,
        basic_info=basic_info, # Legacy
        current_stage=1, # Immediately enter Stage 1
        stage_question_count=0
    )
    
    # Initial rolling summary
    profile.rolling_summary = f"User {req.nickname}, {req.age}, {req.job}. Anchor Status: {anchor_status.model_dump_json()}"
    
    store.save_user(profile)
    return {"user_id": user_id, "profile": profile}

@app.post("/chat")
async def chat(req: ChatRequest, background_tasks: BackgroundTasks):
    """
    核心对话接口
    """
    if not chat_service:
        raise HTTPException(status_code=500, detail="Chat Service not available")
    
    user = store.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # 1. 执行对话
    response = await chat_service.chat(req.user_id, req.message)
    
    # 2. 检查是否需要触发记忆更新 (每15轮)
    history_len = len(store.get_chat_history(req.user_id))
    if history_len > 0 and history_len % 30 == 0:
        background_tasks.add_task(chat_service.trigger_memory_update, req.user_id)
        
    return {"reply": response}

@app.get("/user/{user_id}")
def get_user_profile(user_id: str):
    user = store.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- 4-Stage Progressive Logic (Dynamic Questioning) ---

@app.post("/stage/next")
async def next_stage_question(req: dict):
    """
    根据当前 Stage 生成动态题目
    req: { user_id: str }
    """
    user_id = req.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
        
    user = store.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    current_stage = user.current_stage
    
    # Check if complete
    if current_stage >= 4:
         return {"status": "complete", "message": "All stages completed. Ready for report."}

    # Gather context from previous interactions
    recent_interactions = user.raw_interactions[-3:] if user.raw_interactions else []
    context_str = "\n".join([f"Q: {log.question_context} A: {log.user_choice}" for log in recent_interactions])

    # Stage Logic
    prompt = ""
    
    if current_stage == 1:
        # Stage 1: Surface Behavior (3 Questions)
        prompt = f"""
        基于用户画像 (职业: {user.static_data.occupation}, 状态: {user.static_data.financial_status})，
        生成一道【Stage 1: 表层行为测试】题目（这是第 {user.stage_question_count + 1}/3 题）。
        逻辑：应激反应测试。询问具体高频场景下的本能动作。
        必须构建具体场景（Scenario-based）。严禁抽象问题。
        
        请严格返回 JSON：
        {{
            "stage": 1,
            "question": "...",
            "options": [
                {{"label": "A", "text": "...", "projection": "..."}},
                {{"label": "B", "text": "...", "projection": "..."}},
                {{"label": "C", "text": "...", "projection": "..."}}
            ]
        }}
        """
    elif current_stage == 2:
        # Stage 2: Deep Drive (3 Questions)
        prompt = f"""
        基于用户上一阶段的行为模式：
        {context_str}
        生成一道【Stage 2: 深层动力测试】题目（这是第 {user.stage_question_count + 1}/3 题）。
        逻辑：归因测试。追问背后的价值观。
        
        请严格返回 JSON：
        {{
            "stage": 2,
            "question": "...",
            "options": [
                {{"label": "A", "text": "...", "projection": "..."}},
                {{"label": "B", "text": "...", "projection": "..."}},
                {{"label": "C", "text": "...", "projection": "..."}}
            ]
        }}
        """
    elif current_stage == 3:
        # Stage 3: Shadow/Defense (2 Questions)
        prompt = f"""
        基于用户的深层动力：
        {context_str}
        生成一道【Stage 3: 阴影与防御测试】题目（这是第 {user.stage_question_count + 1}/2 题）。
        逻辑：高压/两难选择。逼出防御机制。
        
        请严格返回 JSON：
        {{
            "stage": 3,
            "question": "...",
            "options": [
                {{"label": "A", "text": "...", "projection": "..."}},
                {{"label": "B", "text": "...", "projection": "..."}}
            ]
        }}
        """
    else:
        return {"status": "complete"}

    response = await gemini_service.generate_content_async(prompt)
    cleaned_response = response.replace("```json", "").replace("```", "").strip()
    
    try:
        data = json.loads(cleaned_response)
        return data
    except json.JSONDecodeError:
        return {"error": "Failed to generate question", "raw": response}

@app.post("/stage/submit")
async def submit_stage_answer(req: dict):
    """
    提交答案，并检查是否触发 Stage 结算
    req: { user_id: str, stage: int, choice: str, projection: str }
    """
    user_id = req.get("user_id")
    stage = req.get("stage")
    choice = req.get("choice")
    projection = req.get("projection")
    
    user = store.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # 1. Log Interaction
    log = InteractionLog(
        stage=f"Stage {stage}",
        question_context=f"Q{user.stage_question_count + 1}", 
        user_choice=choice,
        ai_analysis=projection # Temporary store projection here
    )
    user.raw_interactions.append(log)
    user.stage_question_count += 1
    
    # 2. Check Thresholds & Generate Feedback
    finished_stage = False
    feedback = None
    
    # Define thresholds: Stage 1->3, Stage 2->3, Stage 3->2
    if user.current_stage == 1 and user.stage_question_count >= 3:
        finished_stage = True
    elif user.current_stage == 2 and user.stage_question_count >= 3:
        finished_stage = True
    elif user.current_stage == 3 and user.stage_question_count >= 2:
        finished_stage = True
        
    if finished_stage:
        # Generate Stage Feedback (Hook)
        feedback_prompt = f"""
        用户刚刚完成了 Stage {user.current_stage}。
        测试记录：
        {json.dumps([x.model_dump() for x in user.raw_interactions[-user.stage_question_count:]], default=str)}
        
        请给出一段 150-200 字的【即时反馈】。
        结构：
        1. 肯定："我看到了你..."
        2. 洞察："这说明..."
        3. 诱导(Hook)："但这背后是否藏着...？下一轮我们来看..."
        """
        feedback = await gemini_service.generate_content_async(feedback_prompt)
        
        # Advance Stage
        user.current_stage += 1
        user.stage_question_count = 0
    
    store.save_user(user)
    
    return {
        "feedback": feedback, 
        "next_stage": user.current_stage,
        "is_stage_complete": finished_stage
    }

# --- Final Report (Refactored) ---

@app.post("/report/generate")
async def generate_report(req: ReportRequest):
    user = store.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Aggregate all interaction logs
    interactions_text = "\n".join([f"[{log.stage}] Choice: {log.user_choice} -> Projection: {log.ai_analysis}" for log in user.raw_interactions])
    
    prompt = f"""
    基于以下用户全流程测试数据，生成【深度个人使用说明书】。
    
    【用户画像】: {user.static_data.model_dump_json()}
    【测试记录】:
    {interactions_text}
    
    请输出 JSON 格式报告：
    {{
        "core_persona": "...", // 核心画像定义 (如“风暴中的独行船长”)
        "inner_conflict": "...", // 内在死结
        "risk_prediction": "...", // 行为预测 (高压下的风险点)
        "evolution_suggestion": "...", // 进化建议
        "full_markdown": "..." // 完整的 Markdown 格式长文报告
    }}
    """
    
    response = await gemini_service.generate_content_async(prompt)
    cleaned_response = response.replace("```json", "").replace("```", "").strip()
    
    try:
        report_data = json.loads(cleaned_response)
        
        report = AnalysisReport(
            report_id=str(uuid.uuid4()),
            user_id=req.user_id,
            core_persona=report_data.get("core_persona", ""),
            inner_conflict=report_data.get("inner_conflict", ""),
            risk_prediction=report_data.get("risk_prediction", ""),
            evolution_suggestion=report_data.get("evolution_suggestion", ""),
            full_markdown=report_data.get("full_markdown", ""),
            version=1
        )
        store.save_report(report)
        
        # Also update user psych_profile if possible (Simplified for now)
        user.psych_profile.core_drive = report_data.get("core_persona", "Unknown")
        store.save_user(user)
        
        return {"report": report}
        
    except json.JSONDecodeError:
        # Fallback for plain text response
        return {"error": "Failed to parse report JSON", "raw": response}

@app.get("/report/{user_id}")
def get_reports(user_id: str):
    if user_id not in store.reports:
        return []
    return store.reports[user_id]

# --- Legacy/Helper Endpoints (Keep for compatibility if needed) ---

@app.post("/scenario/generate")
async def generate_scenario_legacy(req: ScenarioRequest):
    # Map to new logic or keep as standalone tool
    return {} 

@app.post("/scenario/submit")
async def submit_scenario_choice_legacy(req: dict):
    # Reuse existing logic
    return {"reply": "Legacy endpoint"}

# --- Feature 2.2 & 2.3 Helpers (Tags, Shadow) ---
# Keep them as standalone tools for specific interactions outside the main flow

@app.post("/tags/generate")
async def generate_tags(req: TagCloudRequest):
    # ... existing implementation ...
    user = store.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    prompt = f"""
    基于用户资料 (职业: {user.static_data.occupation}) 和摘要: "{user.rolling_summary}"
    生成 50 个描述其潜在性格、状态或价值观的短词汇 (Tag)。
    请严格返回 JSON 字符串数组。
    """
    response = await gemini_service.generate_content_async(prompt)
    cleaned_response = response.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned_response)
    except:
        return ["探索者", "思考者"] * 10

@app.post("/tags/select")
def select_tags(req: TagCloudSelectRequest):
    # ... existing implementation ...
    return {"status": "success"}

@app.post("/shadow/generate")
async def generate_shadow_work(req: ShadowWorkRequest):
    # ... existing implementation ...
    prompt = "Generate a shadow work question."
    question = await gemini_service.generate_content_async(prompt)
    return {"question": question.strip()}

@app.post("/shadow/submit")
def submit_shadow_work(req: ShadowWorkSubmitRequest):
    # ... existing implementation ...
    return {"status": "recorded"}

# MBTI Endpoints (Legacy or Optional)
@app.post("/mbti/quiz")
async def generate_mbti_quiz(req: MBTIQuizRequest):
    # ... existing implementation ...
    return []

@app.post("/mbti/submit")
def submit_mbti_result(req: MBTISubmitRequest):
    # ... existing implementation ...
    return {"status": "success"}

@app.post("/mbti/analyze")
async def analyze_mbti_quiz(req: MBTIQuizAnswerRequest):
    # ... existing implementation ...
    return {"mbti": "INFJ"}
