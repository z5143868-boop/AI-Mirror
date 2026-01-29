import { useState, useEffect } from 'react';
import { getStageQuestion, submitStageAnswer, StageQuestion, StageSubmitResponse } from '../api';
import { Brain, ArrowRight, CheckCircle, Loader } from 'lucide-react';

interface AssessmentStageProps {
    userId: string;
    onStageComplete: (nextStage: number) => void;
}

export default function AssessmentStage({ userId, onStageComplete }: AssessmentStageProps) {
    const [questionData, setQuestionData] = useState<StageQuestion | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [nextStageNum, setNextStageNum] = useState<number | null>(null);

    // Load question on mount
    useEffect(() => {
        loadQuestion();
    }, [userId]);

    const loadQuestion = async () => {
        setLoading(true);
        try {
            const data = await getStageQuestion(userId);
            if (data.status === 'complete') {
                // Determine if we are really done (Stage 4)
                onStageComplete(4); 
            } else {
                setQuestionData(data);
            }
        } catch (error) {
            console.error("Failed to load question", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = async (option: { label: string, text: string, projection: string }) => {
        if (!questionData || submitting) return;
        
        setSubmitting(true);
        try {
            const res: StageSubmitResponse = await submitStageAnswer(
                userId,
                questionData.stage,
                option.text,
                option.projection
            );
            
            if (res.is_stage_complete && res.feedback) {
                // Stage complete: Show Feedback
                setFeedback(res.feedback);
                setNextStageNum(res.next_stage);
            } else {
                // Stage not complete: Just next question (Micro-feedback skipped for now or add Toast)
                setNextStageNum(res.next_stage); // Should be same stage
                setSubmitting(false);
                loadQuestion(); // Reload next question immediately
            }

        } catch (error) {
            console.error("Failed to submit answer", error);
            alert("提交失败，请重试");
            setSubmitting(false);
        }
    };

    const handleNextStage = () => {
        if (nextStageNum !== null) {
            // Reset local state
            setFeedback(null);
            setQuestionData(null);
            setSubmitting(false);
            
            // Notify parent to update global stage state
            onStageComplete(nextStageNum);
            
            // Reset nextStageNum
            setNextStageNum(null);
            
            // Reload next question
            loadQuestion(); 
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
                <Loader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-400 animate-pulse">AI 正在潜入你的潜意识...</p>
            </div>
        );
    }

    if (!questionData) return null;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center">
            {/* Header */}
            <div className="w-full max-w-2xl flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-400" />
                    <span className="font-bold text-slate-300 tracking-wider">STAGE {questionData.stage}</span>
                </div>
                <div className="text-xs text-slate-500">AI Mirror Protocol v2.0</div>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-2xl relative">
                
                {/* Question Card */}
                <div className={`transition-all duration-500 ${feedback ? 'opacity-50 blur-sm scale-95' : 'opacity-100 scale-100'}`}>
                    <h1 className="text-2xl md:text-3xl font-bold leading-relaxed mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
                        {questionData.question}
                    </h1>

                    <div className="space-y-4">
                        {questionData.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(opt)}
                                disabled={submitting}
                                className="w-full p-6 rounded-xl bg-slate-800 border border-slate-700 hover:border-purple-500 hover:bg-slate-700/80 transition-all text-left group relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-slate-600 group-hover:bg-purple-500 transition-colors"></div>
                                <div className="flex items-start gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 font-bold group-hover:text-purple-400 border border-slate-700">
                                        {opt.label}
                                    </span>
                                    <span className="text-lg text-slate-300 group-hover:text-white">{opt.text}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Feedback Overlay (Modal) */}
                {feedback && (
                    <div className="absolute inset-0 flex items-center justify-center z-50">
                        <div className="bg-slate-900/90 absolute inset-0 backdrop-blur-sm rounded-3xl"></div>
                        <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl relative z-10 w-full max-w-lg mx-4 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-3 mb-4 text-green-400">
                                <CheckCircle className="w-6 h-6" />
                                <span className="font-bold uppercase tracking-wider text-sm">阶段完成 / 获得洞察</span>
                            </div>
                            
                            <div className="prose prose-invert mb-8">
                                <p className="text-slate-300 leading-relaxed text-lg italic">
                                    "{feedback}"
                                </p>
                            </div>

                            <button
                                onClick={handleNextStage}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25"
                            >
                                <span>进入下一阶段</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
