from typing import Dict, List
from models import UserProfile, AnalysisReport, InteractionLog

class InMemoryStore:
    def __init__(self):
        # Key: user_id
        self.users: Dict[str, UserProfile] = {}
        
        # Key: user_id, Value: List of conversation strings (e.g. "User: ...", "AI: ...")
        self.chat_histories: Dict[str, List[str]] = {}
        
        # Legacy logs - kept for structure but using generic or deprecated
        self.interaction_logs: Dict[str, InteractionLog] = {}
        
        # Key: user_id (Assuming one active report per user for simplicity, or we can store list)
        self.reports: Dict[str, List[AnalysisReport]] = {}

    def get_user(self, user_id: str) -> UserProfile:
        return self.users.get(user_id)

    def save_user(self, user: UserProfile):
        self.users[user.user_id] = user

    def get_chat_history(self, user_id: str) -> List[str]:
        return self.chat_histories.get(user_id, [])

    def append_chat_history(self, user_id: str, message: str):
        if user_id not in self.chat_histories:
            self.chat_histories[user_id] = []
        self.chat_histories[user_id].append(message)
    
    def clear_chat_history(self, user_id: str):
        self.chat_histories[user_id] = []

    def save_report(self, report: AnalysisReport):
        if report.user_id not in self.reports:
            self.reports[report.user_id] = []
        self.reports[report.user_id].append(report)

# Global instance
store = InMemoryStore()
