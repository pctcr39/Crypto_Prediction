"use client";

import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface FundingData {
    time: string;
    rate: number;
}

export function FundingRateChart({ symbol }: { symbol: string }) {
    const [data, setData] = useState<FundingData[]>([]);

    useEffect(() => {
        // Simulating Funding Rate Data (Real data requires futures API)
        const generateData = () => {
            const now = new Date();
            const items = Array.from({ length: 24 }).map((_, i) => {
                // 8 hour intervals usually
                const t = new Date(now.getTime() - (23 - i) * 8 * 3600 * 1000);
                return {
                    time: t.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' }),
                    rate: (Math.random() - 0.5) * 0.05 // Ranges from -0.025% to +0.025%
                };
            });
            setData(items);
        };
        generateData();
    }, [symbol]);

    return (
        <Card className="h-[350px] border-white/5 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="py-3 px-4 border-b border-white/5">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-slate-400">Futures Funding Rate</CardTitle>
                    <div className="text-xs text-slate-500">Predicted: <span className="text-emerald-400">+0.0100%</span> (Longs Pay)</div>
                </div>
            </CardHeader>
            <CardContent className="p-0 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={50} tickFormatter={(val) => `${val.toFixed(3)}%`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", fontSize: '12px' }}
                            formatter={(value: any) => [`${Number(value).toFixed(4)}%`, "Rate"]}
                        />
                        <Bar dataKey="rate">
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.rate >= 0 ? "#10b981" : "#f43f5e"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
