"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "lucide-react";
// Wait, I don't have a Badge component yet, and Lucide doesn't export Badge component (it exports icons).
// I will simulate Badge with a span or simple div first/
// I will use a simple span with classes.

interface PredictionData {
    symbol: string;
    price: number;
    rsi: number;
    signal: "BUY" | "SELL" | "NEUTRAL";
    trend: "UP" | "DOWN" | "SIDEWAYS";
}

export function PredictionCard({ symbol = "BTCUSDT" }: { symbol?: string }) {
    const [data, setData] = useState<PredictionData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrediction = async () => {
            try {
                const res = await fetch(`/api/prediction?symbol=${symbol}`);
                const json = await res.json();
                if (json.signal) {
                    setData(json);
                }
            } catch (e) {
                console.error("Failed to fetch prediction", e);
            } finally {
                setLoading(false);
            }
        };

        fetchPrediction();
        const interval = setInterval(fetchPrediction, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, [symbol]);

    if (loading) {
        return (
            <Card className="animate-pulse h-full">
                <CardHeader><div className="h-6 w-32 bg-slate-800 rounded" /></CardHeader>
                <CardContent><div className="h-24 bg-slate-800 rounded" /></CardContent>
            </Card>
        );
    }

    if (!data) return null;

    return (
        <Card className="h-full border-t-4 border-t-slate-500 overflow-hidden relative"
            style={{
                borderColor: data.signal === 'BUY' ? '#10b981' : (data.signal === 'SELL' ? '#ef4444' : '#64748b')
            }}
        >
            <div className="absolute top-0 right-0 p-3 opacity-20 text-9xl font-bold -mt-4 -mr-4 select-none pointer-events-none">
                {data.signal[0]}
            </div>

            <CardHeader>
                <CardTitle className="flex justify-between items-center z-10">
                    <span>{data.symbol} Prediction</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${data.signal === 'BUY' ? 'bg-emerald-500/20 text-emerald-500' :
                            data.signal === 'SELL' ? 'bg-rose-500/20 text-rose-500' :
                                'bg-slate-500/20 text-slate-400'
                        }`}>
                        {data.signal}
                    </span>
                </CardTitle>
                <CardDescription>AI Technical Analysis</CardDescription>
            </CardHeader>

            <CardContent className="z-10 relative">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs text-slate-500">RSI (14)</div>
                        <div className={`text-xl font-mono font-medium ${data.rsi > 70 ? 'text-rose-400' : data.rsi < 30 ? 'text-emerald-400' : 'text-slate-200'
                            }`}>
                            {data.rsi.toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Trend</div>
                        <div className="text-xl font-medium text-white">
                            {data.trend}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
