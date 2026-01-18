"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Activity } from "lucide-react";

interface Ticker24h {
    symbol: string;
    priceChange: string;
    priceChangePercent: string;
    prevClosePrice: string;
    lastPrice: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
}

export function MarketStats({ symbol }: { symbol: string }) {
    const [data, setData] = useState<Ticker24h | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // We can use the test-binance endpoint or creating a new one, 
                // but for simplicity let's just use the public binance API directly client side 
                // to avoid server overhead for public data, OR better, create a simple server action/route.
                // Let's use a server route to keep API keys safe if we needed them (we don't for public, but CORS).
                // Actually, we can reuse the existing pattern.

                // Let's assume we create a route or usage of existing wrapper.
                // For quick implementation, I will just stick to a new client-side fetch if CORS allows, 
                // but Binance blocks CORS. So I need a route.
                // I'll create a generic proxy route for ticker/24hr or just use `binanceClient` in a server component?
                // `MarketStats` is client component. 
                // Let's make a new route `api/ticker/24hr`.

                const res = await fetch(`/api/ticker?symbol=${symbol}`);
                const json = await res.json();
                setData(json);
            } catch (e) {
                console.error("Failed to fetch 24h stats", e);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, [symbol]);

    if (!data) return <div className="text-xs text-slate-500 animate-pulse">Loading stats...</div>;

    return (
        <div className="flex items-center gap-6 text-sm">
            <div className="flex flex-col">
                <span className="text-xs text-slate-500">24h Change</span>
                <span className={`font-bold ${parseFloat(data.priceChangePercent) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {parseFloat(data.priceChangePercent).toFixed(2)}%
                </span>
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-slate-500">24h High</span>
                <span className="font-bold text-white">${parseFloat(data.highPrice).toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-slate-500">24h Low</span>
                <span className="font-bold text-white">${parseFloat(data.lowPrice).toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-slate-500">24h Vol</span>
                <span className="font-bold text-white">{parseFloat(data.volume).toFixed(1)}M</span>
            </div>
        </div>
    );
}
