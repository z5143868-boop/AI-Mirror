from typing import List, Optional, Union
from pydantic import BaseModel

class OnboardingRequest(BaseModel):
    nickname: str
    age: Union[str, int] # Support both for compatibility, but intended as string "25-30"
    job: str
    income: str
    gender: str
    core_trouble: str # Added field

class ChatRequest(BaseModel):
    user_id: str
    message: str
    image: Optional[str] = None

class ScenarioRequest(BaseModel):
    user_id: str

class ReportRequest(BaseModel):
    user_id: str

# --- New Models for Features 2.2 & 2.3 ---

class MBTIQuizRequest(BaseModel):
    user_id: str

class MBTISubmitRequest(BaseModel):
    user_id: str
    mbti: str # 路径A: 用户直接提交
    
class MBTIQuizAnswerRequest(BaseModel):
    user_id: str
    answers: List[int] # 路径B: 用户提交5道题的答案 (0 or 1)
    
class TagCloudRequest(BaseModel):
    user_id: str

class TagCloudSelectRequest(BaseModel):
    user_id: str
    selected_tags: List[str]

class ShadowWorkRequest(BaseModel):
    user_id: str

class ShadowWorkSubmitRequest(BaseModel):
    user_id: str
    question: str
    is_admitted: bool
