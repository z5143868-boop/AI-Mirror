from typing import List, Dict
from models import UserProfile
from services.gemini_service import GeminiService
from services.memory_service import RollingMemoryService
from store import store
import asyncio

class ChatService:
    def __init__(self):
        self.gemini = GeminiService()
        self.memory_service = RollingMemoryService()
        self.MEMORY_TRIGGER_COUNT = 15

    async def chat(self, user_id: str, user_message: str, image_data: str = None) -> str:
        # 1. 获取用户资料
        user_profile = store.get_user(user_id)
        if not user_profile:
            return "Error: User not found. Please complete onboarding first."

        # 2. 构建 System Prompt
        system_prompt = self._build_system_prompt(user_profile)

        # 3. 获取近期对话历史 (Context Window)
        # 我们只把最近的 N 条发给 LLM 作为 Context，避免 Token 溢出
        # 完整的历史记录保存在 store 中用于生成 Summary
        full_history = store.get_chat_history(user_id)
        recent_history = full_history[-10:] # 取最近10条作为 Context

        # 4. 调用 LLM
        # 这里的 prompt 构造可以优化，比如使用 messages 数组
        # 为了简单适配 GeminiService.generate_content_async (它只接受 string prompt)，我们拼接一下
        # 实际上最好是改造 GeminiService 支持 messages 列表，但现在先拼接
        
        conversation_context = "\n".join(recent_history)
        full_prompt = f"""
{system_prompt}

【最近的对话历史】：
{conversation_context}

User: {user_message}
AI: 
"""
        response_text = await self.gemini.generate_content_async(full_prompt, image_data=image_data)
        
        # 解析 CoT 输出，只返回回答给用户，思维链可以存日志或调试
        final_reply = response_text
        if "[回答]" in response_text:
            parts = response_text.split("[回答]")
            # thought_process = parts[0].replace("[思维链]", "").strip()
            final_reply = parts[1].strip()
        
        # 5. 保存对话历史 (存最终回复)
        store.append_chat_history(user_id, f"User: {user_message} {'[Image Sent]' if image_data else ''}")
        store.append_chat_history(user_id, f"AI: {final_reply}")

        return final_reply

    def _build_system_prompt(self, profile: UserProfile) -> str:
        base_prompt = """
你是一个资深的心理咨询师和长期陪伴者 (AI Mirror)。
你的目标是通过对话深入了解用户的性格、潜意识和行为模式。
你需要表现出高度的同理心、专业洞察力，并且循序渐进地引导用户探索自我。

【核心原则】：
1. 采用 CoT (思维链) 模式：你必须先在【思维链】中详细分析用户的情绪、潜在心理动机和逻辑漏洞，然后再给出【回答】。
   输出格式如下：
   [思维链]
   (这里写你的分析过程...)
   [回答]
   (这里写你给用户的回复，不要包含分析过程)
2. 像朋友一样交谈，但保持专业边界。
3. 不要急于下结论，多提问，多引导。

【工具引导策略】：
你不仅仅是倾听者，更是引导者。当用户谈论到特定话题时，请建议他们使用左侧工具栏的功能（但不要强迫）：
1. 如果用户对自己的性格感到困惑，建议进行【性格标签 (Tag Cloud)】生成，通过 # 图标进入。
2. 如果用户面临职场或生活选择，建议进行【场景模拟 (Scenario Test)】，通过 User 图标进入。
3. 如果用户表现出恐惧、焦虑或回避，建议进行【阴影探索 (Shadow Work)】，通过 Moon 图标进入。

请在对话中自然地融入这些建议，例如：“听起来你在职场选择上有些纠结，或许我们可以做一个场景模拟来看看你的潜意识倾向？”
"""
        
        # 注入 Rolling Summary (长期记忆)
        memory_block = f"""
【关于用户的长期记忆】：
{profile.rolling_summary if profile.rolling_summary else "（暂无长期记忆，这是你们的初次深度交流）"}
"""

        # 注入基本信息
        info_block = f"""
【用户基本资料】：
昵称: {profile.basic_info.nickname}
职业: {profile.basic_info.job}
年龄: {profile.basic_info.age}
"""

        return base_prompt + info_block + memory_block

    async def trigger_memory_update(self, user_id: str):
        """
        提取最近 N 轮对话，更新 Rolling Summary
        """
        user_profile = store.get_user(user_id)
        full_history = store.get_chat_history(user_id)
        
        # 取出最近的一批对话用于总结
        # 假设是最近 MEMORY_TRIGGER_COUNT 条
        recent_logs = full_history[-self.MEMORY_TRIGGER_COUNT:]
        
        new_summary = await self.memory_service.update_summary(user_profile, recent_logs)
        
        # 更新 Profile
        user_profile.rolling_summary = new_summary
        store.save_user(user_profile)
        print(f"[Memory] Updated summary for user {user_id}")

