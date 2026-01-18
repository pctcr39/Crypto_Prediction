"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Target, Brain, CheckCircle2, XCircle, Clock } from "lucide-react";

interface PredictionPanelProps {
    symbol: string;
}

// Mock History Data
const HISTORY = [
    { time: "10:00", target: 2455.00, actual: 2458.20, status: "HIT" },
    { time: "09:00", target: 2440.50, actual: 2438.10, status: "MISS" },
    { time: "08:00", target: 2435.00, actual: 2436.50, status: "HIT" },
    { time: "07:00", target: 2420.00, actual: 2422.00, status: "HIT" },
    { time: "06:00", target: 2415.00, actual: 2410.00, status: "MISS" },
    { time: "05:00", target: 2425.00, actual: 2428.00, status: "HIT" },
    { time: "04:00", target: 2418.00, actual: 2420.00, status: "HIT" },
];

export function PredictionPanel({ symbol }: PredictionPanelProps) {
    // Current Prediction Mock
    const predictedPrice = 2465.50;
    const currentPrice = 2458.20;
    const direction = predictedPrice > currentPrice ? "UP" : "DOWN";
    const diff = Math.abs(predictedPrice - currentPrice);

    // Calculate Dynamic Accuracy
    const wins = HISTORY.filter(h => h.status === 'HIT').length;
    const total = HISTORY.length;
    const accuracy = ((wins / total) * 100).toFixed(1);

    return (
        <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
            {/* Main Prediction */}
            <div className="space-y-2 shrink-0">
                <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">AI Target (Next 1h)</div>
                <div className="flex items-end gap-3">
                    <div className="text-3xl font-bold text-white">${predictedPrice.toLocaleString()}</div>
                    <Badge variant={direction === 'UP' ? 'default' : 'destructive'} className="mb-1">
                        {direction === 'UP' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                        {direction}
                    </Badge>
                </div>
                <div className="text-xs text-slate-500">
                    Expected Move: <span className="text-white font-mono">{diff.toFixed(2)}</span>
                </div>
            </div>

            {/* Accuracy Card */}
            <Card className="bg-slate-900 border-white/5 shrink-0">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${Number(accuracy) > 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            <Target className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-slate-300">Win Rate</div>
                            <div className="text-xs text-slate-500">Last {total} signals</div>
                        </div>
                    </div>
                    <div className={`text-xl font-bold ${Number(accuracy) > 50 ? 'text-emerald-400' : 'text-red-400'}`}>{accuracy}%</div>
                </CardContent>
            </Card>

            {/* Model Parameters */}
            <div className="space-y-3 shrink-0">
                <div className="text-xs text-slate-400 uppercase tracking-widest font-bold flex items-center gap-2">
                    <Brain className="w-3 h-3" /> Model Drivers
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900/50 border border-white/5 p-2 rounded">
                        <div className="text-[10px] text-slate-500">RSI (14)</div>
                        <div className="text-sm font-medium text-white">42.5</div>
                    </div>
                    <div className="bg-slate-900/50 border border-white/5 p-2 rounded">
                        <div className="text-[10px] text-slate-500">Vol (ATR)</div>
                        <div className="text-sm font-medium text-emerald-400">Low</div>
                    </div>
                    <div className="bg-slate-900/50 border border-white/5 p-2 rounded">
                        <div className="text-[10px] text-slate-500">Funding</div>
                        <div className="text-sm font-medium text-amber-400">0.01%</div>
                    </div>
                    <div className="bg-slate-900/50 border border-white/5 p-2 rounded">
                        <div className="text-[10px] text-slate-500">Trend (ADX)</div>
                        <div className="text-sm font-medium text-white">22.1</div>
                    </div>
                </div>
            </div>

            {/* Prediction History List */}
            <div className="flex-1 min-h-0 flex flex-col gap-2">
                <div className="text-xs text-slate-400 uppercase tracking-widest font-bold flex items-center gap-2 mt-2">
                    <Clock className="w-3 h-3" /> History
                </div>
                <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                    {HISTORY.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900/30 border border-white/5 text-xs">
                            <span className="text-slate-500 font-mono">{item.time}</span>
                            <div className="flex gap-4">
                                <span className="text-slate-300">Target: <span className="font-bold">{item.target}</span></span>
                            </div>
                            <Badge variant="outline" className={`border-0 ${item.status === 'HIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {item.status === 'HIT' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                {item.status}
                            </Badge>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
