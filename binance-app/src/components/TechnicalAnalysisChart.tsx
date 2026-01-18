"use client";

import { useEffect, useState } from "react";
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IndicatorData {
    time: string;
    rsi: number;
    macd: number;
    signal: number;
    histogram: number;
}

export function TechnicalAnalysisChart({ symbol }: { symbol: string }) {
    const [data, setData] = useState<IndicatorData[]>([]);

    useEffect(() => {
        // Simulating indicator data generation for demo
        // In a real app, this would be calculated serverside or via a library like 'technicalindicators' on the candle history
        const generateData = () => {
            const now = new Date();
            const items = Array.from({ length: 48 }).map((_, i) => {
                const t = new Date(now.getTime() - (47 - i) * 3600 * 1000);
                return {
                    time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    rsi: 30 + Math.random() * 40 + (Math.sin(i / 5) * 20), // RSI swings 30-70 usually
                    macd: Math.sin(i / 8) * 50,
                    signal: Math.sin(i / 8 - 0.5) * 50,
                    histogram: (Math.sin(i / 8) - Math.sin(i / 8 - 0.5)) * 50
                };
            });
            setData(items);
        };
        generateData();
    }, [symbol]);

    return (
        <Card className="h-[350px] border-white/5 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="py-3 px-4 border-b border-white/5">
                <CardTitle className="text-sm font-medium text-slate-400">Momentum Indicators</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[300px]">
                <Tabs defaultValue="rsi" className="w-full h-full flex flex-col">
                    <div className="px-4 py-2 border-b border-white/5 bg-slate-900/40">
                        <TabsList className="h-8 bg-slate-800/50">
                            <TabsTrigger value="rsi" className="text-xs">RSI (14)</TabsTrigger>
                            <TabsTrigger value="macd" className="text-xs">MACD (12, 26, 9)</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="rsi" className="flex-1 w-full min-h-0 mt-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="time" hide />
                                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={false} width={40} />
                                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", fontSize: '12px' }} />
                                <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" />
                                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </TabsContent>

                    <TabsContent value="macd" className="flex-1 w-full min-h-0 mt-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="time" hide />
                                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={40} />
                                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", fontSize: '12px' }} />
                                <Bar dataKey="histogram" fill="#94a3b8" opacity={0.5} barSize={4} />
                                <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="signal" stroke="#f97316" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
