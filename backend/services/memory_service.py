from typing import List
from services.gemini_service import GeminiService
from models import UserProfile

class RollingMemoryService:
    def __init__(self):
        self.gemini_service = GeminiService()

    async def update_summary(self, profile: UserProfile, new_chat_logs: List[str]) -> str:
        """
        核心逻辑：滑动窗口摘要 (Sliding Window Summary)
        调用 LLM 将新对话中的关键信息合并到现有的 rolling_summary 中。
        """
        
        # 构造 Prompt
        prompt = f"""
        你是一个专业的记忆整理员。你的任务是将新的对话内容合并到用户的长期记忆摘要中。
        
        【当前记忆摘要】：
        {profile.rolling_summary if profile.rolling_summary else "（暂无记忆）"}
        
        【新发生的对话 (最近 {len(new_chat_logs)} 轮)】：
        {chr(10).join(new_chat_logs)}
        
        【指令】：
        1. 提取新对话中的关键事实（如职业变化、家庭状况、重大事件）。
        2. 捕捉用户的情绪模式和心理特征（如焦虑点、价值观）。
        3. 将上述信息与【当前记忆摘要】进行智能合并。
        4. 保持摘要简洁、客观，使用第三人称。
        5. 忽略无关的闲聊（如打招呼、天气）。
        6. 直接输出更新后的摘要文本，不要包含任何解释性语言。
        """
        
        # 调用 LLM
        new_summary = await self.gemini_service.generate_content_async(prompt)
        
        # 简单的后处理（防止 LLM 输出空）
        if not new_summary or "Error" in new_summary:
            return profile.rolling_summary # 如果失败，保持原样
            
        return new_summary.strip()
