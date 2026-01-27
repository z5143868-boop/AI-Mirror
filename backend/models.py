from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# 1.1 核心逻辑实体 (ER Diagram Mapped to Pydantic)

# --- JSON Field Structures ---

class BasicInfo(BaseModel):
    nickname: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    job: Optional[str] = None
    income: Optional[str] = None

class EnergyMap(BaseModel):
    high_energy: List[str] = Field(default_factory=list)
    low_energy: List[str] = Field(default_factory=list)
    fear: str = ""

# --- Core Entities ---

class User(BaseModel):
    user_id: str
    open_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

class UserProfile(BaseModel):
    profile_id: str
    user_id: str
    basic_info: BasicInfo = Field(default_factory=BasicInfo)
    mbti_result: Optional[str] = None
    energy_map: EnergyMap = Field(default_factory=EnergyMap)
    rolling_summary: str = "" # 滚动记忆摘要 (RAG核心)
    completeness: float = 0.0 # 0-100

class ScenarioLog(BaseModel):
    log_id: str
    user_id: str
    scenario_context: str
    user_choice: str # A/B/C/D
    psychological_projection: str # 选项背后的心理含义
    created_at: datetime = Field(default_factory=datetime.now)

class ShadowLog(BaseModel):
    log_id: str
    user_id: str
    question: str
    is_admitted: bool # Yes/No
    is_skipped: bool = False
    created_at: datetime = Field(default_factory=datetime.now)

class AnalysisReport(BaseModel):
    report_id: str
    user_id: str
    full_markdown: str
    version: int
    created_at: datetime = Field(default_factory=datetime.now)
