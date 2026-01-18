"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Order {
    price: number;
    amount: number;
    total: number;
}

export function OrderBook({ symbol }: { symbol: string }) {
    const [bids, setBids] = useState<Order[]>([]);
    const [asks, setAsks] = useState<Order[]>([]);
    const [lastPrice, setLastPrice] = useState<number>(0);

    // Simulate Order Book Data
    useEffect(() => {
        const generateData = () => {
            // Mock base price around 40000-60000 for BTC or generic
            const base = 95000 + Math.random() * 100; // Based on screenshot ~95k
            setLastPrice(base);

            const newAsks = Array.from({ length: 15 }).map((_, i) => ({
                price: base + (i + 1) * 0.5,
                amount: Math.random() * 1.5,
                total: Math.random() * 10
            })).reverse(); // Highest ask on top? No, lowest ask on bottom of ask list.
            // Standard view: Asks (Red) on top, sorted descending (highest at top? No, lowest ask is closest to market price).
            // Usually visual:
            // High Ask
            // ...
            // Low Ask
            // --- Market Price ---
            // High Bid
            // ...
            // Low Bid

            setAsks(newAsks);

            const newBids = Array.from({ length: 15 }).map((_, i) => ({
                price: base - (i + 1) * 0.5,
                amount: Math.random() * 2,
                total: Math.random() * 15
            }));
            setBids(newBids);
        };

        generateData();
        const interval = setInterval(generateData, 1000); // 1s update
        return () => clearInterval(interval);
    }, [symbol]);

    return (
        <Card className="h-[600px] border-white/5 bg-slate-900/50 backdrop-blur-xl flex flex-col font-mono text-xs">
            <CardHeader className="py-3 px-4 border-b border-white/5">
                <CardTitle className="text-sm font-medium text-slate-400">Order Book</CardTitle>
            </CardHeader>

            <div className="flex-1 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="grid grid-cols-3 px-4 py-2 text-slate-500">
                    <div>Price (USDT)</div>
                    <div className="text-right">Size ({symbol.replace('USDT', '')})</div>
                    <div className="text-right">Sum ({symbol.replace('USDT', '')})</div>
                </div>

                {/* Asks (Sells) - Red */}
                <div className="flex-1 overflow-hidden flex flex-col justify-end pb-2">
                    {asks.map((order, i) => (
                        <div key={i} className="grid grid-cols-3 px-4 py-0.5 hover:bg-slate-800/50 cursor-pointer">
                            <div className="text-rose-500">{order.price.toFixed(1)}</div>
                            <div className="text-right text-slate-300">{order.amount.toFixed(3)}</div>
                            <div className="text-right text-slate-500">{order.total.toFixed(3)}</div>
                        </div>
                    ))}
                </div>

                {/* Last Price */}
                <div className="py-3 px-4 border-y border-white/5 flex items-center justify-between">
                    <div className="text-xl font-bold text-emerald-400">
                        {lastPrice.toFixed(1)} <span className="text-xs text-slate-500 ml-1">↑</span>
                    </div>
                </div>

                {/* Bids (Buys) - Green */}
                <div className="flex-1 overflow-hidden pt-2">
                    {bids.map((order, i) => (
                        <div key={i} className="grid grid-cols-3 px-4 py-0.5 hover:bg-slate-800/50 cursor-pointer">
                            <div className="text-emerald-500">{order.price.toFixed(1)}</div>
                            <div className="text-right text-slate-300">{order.amount.toFixed(3)}</div>
                            <div className="text-right text-slate-500">{order.total.toFixed(3)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}
