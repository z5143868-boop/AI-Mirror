import { useState, useEffect } from 'react';
import { generateReport, AnalysisReport } from '../api';
import { FileText, Shield, AlertTriangle, Zap, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ReportViewProps {
    userId: string;
}

export default function ReportView({ userId }: ReportViewProps) {
    const [report, setReport] = useState<AnalysisReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const data = await generateReport(userId);
                setReport(data);
            } catch (error) {
                console.error("Failed to generate report", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
                <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-blue-500 animate-progress"></div>
                </div>
                <p className="text-slate-400 font-mono">正在生成你的深度个人使用说明书...</p>
                <style>{`
                    @keyframes progress {
                        0% { width: 0% }
                        100% { width: 100% }
                    }
                    .animate-progress {
                        animation: progress 3s ease-in-out infinite;
                    }
                `}</style>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">
                无法加载报告。
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
            <div className="max-w-4xl mx-auto p-6 md:p-12">
                
                {/* Header */}
                <header className="mb-16 text-center border-b border-slate-800 pb-12">
                    <div className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-[0.2em] rounded-full mb-6">
                        机密文档 (CONFIDENTIAL)
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                        深度个人使用说明书
                    </h1>
                    <p className="text-slate-500 font-mono text-sm">
                        ID: {userId.split('-')[0]} • 由 AI MIRROR 生成
                    </p>
                </header>

                {/* Core Persona */}
                <section className="mb-12">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">核心画像</h2>
                            <p className="text-slate-500 text-sm">Core Persona</p>
                        </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
                        <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                            {report.core_persona}
                        </h3>
                    </div>
                </section>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Inner Conflict */}
                    <section className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4 text-orange-400">
                            <Shield className="w-5 h-5" />
                            <h3 className="font-bold uppercase tracking-wider text-sm">内在死结 (Inner Conflict)</h3>
                        </div>
                        <p className="text-lg leading-relaxed text-slate-300">
                            {report.inner_conflict}
                        </p>
                    </section>

                    {/* Risk Prediction */}
                    <section className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4 text-red-400">
                            <AlertTriangle className="w-5 h-5" />
                            <h3 className="font-bold uppercase tracking-wider text-sm">行为预测 (Risk Prediction)</h3>
                        </div>
                        <p className="text-lg leading-relaxed text-slate-300">
                            {report.risk_prediction}
                        </p>
                    </section>
                </div>

                {/* Evolution Suggestion */}
                <section className="mb-16">
                    <div className="bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/20 p-8 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold text-blue-400 mb-4">进化建议 (Evolution Path)</h3>
                            <p className="text-xl leading-relaxed text-slate-200">
                                {report.evolution_suggestion}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Full Analysis (Markdown) */}
                <section className="prose prose-invert prose-slate max-w-none border-t border-slate-800 pt-12">
                    <h3 className="text-slate-500 font-mono text-sm mb-8 uppercase tracking-widest">完整分析记录 (Full Analysis Log)</h3>
                    <ReactMarkdown>{report.full_markdown}</ReactMarkdown>
                </section>

                {/* Footer */}
                <footer className="mt-24 text-center text-slate-600 py-8 border-t border-slate-900">
                    <p className="text-xs font-mono">AI MIRROR SYSTEM • END OF REPORT</p>
                </footer>
            </div>
        </div>
    );
}
