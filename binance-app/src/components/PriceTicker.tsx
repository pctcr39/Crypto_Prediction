"use client";

import { useEffect, useState } from "react";
import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Mock data for initial display
const MOCK_PAIRS = [
    { symbol: "BTCUSDT", price: "48234.50", change: "+2.45%" },
    { symbol: "ETHUSDT", price: "2834.12", change: "+1.89%" },
    { symbol: "BNBUSDT", price: "345.67", change: "-0.45%" },
    { symbol: "SOLUSDT", price: "98.76", change: "+5.67%" },
];

export function PriceTicker() {
    // Initial mock data as fallback or initial state logic could be improved
    // For now we rely on WS updates.
    const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"];
    const tickerData = useBinanceWebSocket(symbols);

    // Merge mock with real-time to avoid empty state if possible, or just render what we have.
    // Let's render the list based on symbols.

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {symbols.map((symbol) => {
                const data = tickerData[symbol];
                const price = data ? parseFloat(data.price).toFixed(2) : "Loading...";
                const change = data ? parseFloat(data.changePercent).toFixed(2) + "%" : "...";
                const isPositive = data ? !data.changePercent.startsWith("-") : true;

                return (
                    <Card key={symbol} className="p-4 border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-200">{symbol}</span>
                            <span className={cn(
                                "flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
                                isPositive
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-rose-500/10 text-rose-400"
                            )}>
                                {isPositive ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                {change}
                            </span>
                        </div>
                        <div className="text-2xl font-mono text-white">
                            {price}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            Live Data
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
