import { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import AssessmentStage from './components/AssessmentStage';
import ReportView from './components/ReportView';
import { onboarding, OnboardingData, getUserProfile, UserProfile } from './api';
import { Loader } from 'lucide-react';

function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUserId = localStorage.getItem('ai_mirror_user_id');
    if (storedUserId) {
      // Fetch profile
      getUserProfile(storedUserId)
        .then(profile => {
          setUserProfile(profile);
        })
        .catch(err => {
          console.error("Failed to restore session", err);
          // Only clear if 404? For now, just clear to reset.
          localStorage.removeItem('ai_mirror_user_id');
        })
        .finally(() => {
            setLoading(false);
        });
    } else {
        setLoading(false);
    }
  }, []);

  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      setLoading(true);
      const result = await onboarding(data);
      // result = { user_id, profile }
      localStorage.setItem('ai_mirror_user_id', result.user_id);
      setUserProfile(result.profile);
    } catch (error) {
      console.error("Onboarding failed", error);
      alert("初始化失败，请检查后端服务是否已启动");
    } finally {
      setLoading(false);
    }
  };

  const handleStageComplete = (nextStage: number) => {
      if (userProfile) {
          // Optimistic update
          setUserProfile({
              ...userProfile,
              current_stage: nextStage
          });
      }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white">
        <Loader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">系统初始化中 (Initializing System)...</p>
      </div>
    );
  }

  // 1. Stage 0: Onboarding (Anchor Status)
  if (!userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // 2. Stages 1, 2, 3: Assessment
  if (userProfile.current_stage >= 1 && userProfile.current_stage <= 3) {
      return (
          <AssessmentStage 
            userId={userProfile.user_id} 
            onStageComplete={handleStageComplete} 
          />
      );
  }

  // 3. Stage 4: Report (Final Output)
  if (userProfile.current_stage >= 4) {
      return <ReportView userId={userProfile.user_id} />;
  }

  // Fallback
  return (
      <AssessmentStage 
        userId={userProfile.user_id} 
        onStageComplete={handleStageComplete} 
      />
  );
}

export default App;
