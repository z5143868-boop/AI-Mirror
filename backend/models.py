from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# --- Stage 0: Anchor Status (Static Data) ---

class AnchorStatus(BaseModel):
    gender: str = ""
    age_group: str = "" # e.g. "25-30"
    occupation: str = ""
    financial_status: str = "" # e.g. "Stable", "Anxious"
    core_trouble: str = "" # 当前核心困扰

# --- Psych Profile (Core Analysis) ---

class PsychProfile(BaseModel):
    core_drive: str = "Unknown"  # 核心驱动：尊严/控制/恐惧/欲望
    stress_reaction: str = "Unknown" # 压力反应：逃避/攻击/躯体化
    conflict_type: str = "Unknown" # 核心冲突：自由vs安全
    risk_level: str = "Unknown" # Low/Medium/High
    mbti: Optional[str] = None # Keep for compatibility if needed

# --- Interaction Logs ---

class InteractionLog(BaseModel):
    stage: str # "Stage 1", "Stage 2", "Stage 3"
    question_context: str
    user_choice: str
    ai_analysis: str # Immediate feedback/analysis
    timestamp: datetime = Field(default_factory=datetime.now)

# --- Main User Entity ---

class UserProfile(BaseModel):
    user_id: str
    profile_id: str
    
    # Stage 0 Data
    static_data: AnchorStatus = Field(default_factory=AnchorStatus)
    
    # Analysis Result
    psych_profile: PsychProfile = Field(default_factory=PsychProfile)
    
    # Interaction History (Raw Data)
    raw_interactions: List[InteractionLog] = Field(default_factory=list)
    
    # Compatibility Fields (Optional)
    basic_info: Optional[Dict] = None 
    rolling_summary: str = "" 
    
    # State Machine
    current_stage: int = 0 # 0 (Onboarding), 1 (Surface), 2 (Drive), 3 (Shadow), 4 (Report)
    stage_question_count: int = 0 # Track progress within a stage

class AnalysisReport(BaseModel):
    report_id: str
    user_id: str
    core_persona: str # 核心画像定义
    inner_conflict: str # 内在死结
    risk_prediction: str # 行为预测
    evolution_suggestion: str # 进化建议
    full_markdown: str # Legacy/Full text
    created_at: datetime = Field(default_factory=datetime.now)
