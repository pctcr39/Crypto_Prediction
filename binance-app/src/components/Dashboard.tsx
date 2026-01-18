"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceTicker } from "@/components/PriceTicker";
import { PredictionCard } from "@/components/PredictionCard";
import { TradeForm } from "@/components/TradeForm";
import { BotControl } from "@/components/BotControl";
import { ArrowRight, LineChart, TrendingUp } from "lucide-react";

import { useSearchParams } from "next/navigation";

import { CryptoChart } from "@/components/CryptoChart";
import { MarketStats } from "@/components/MarketStats";
import { RightPanel } from "@/components/RightPanel";
import { AdvancedAnalytics } from "@/components/AdvancedAnalytics";

export function Dashboard() {
    const searchParams = useSearchParams();
    const symbol = searchParams.get("symbol") || "BTCUSDT";

    return (
        <div className="container mx-auto px-4 py-6 space-y-6">
            {/* Ticker Section - Compact */}
            <section>
                <PriceTicker />
            </section>

            {/* Selected Market Header */}
            <section className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        {symbol} <span className="text-sm text-slate-500 font-normal px-2 py-0.5 border border-white/10 rounded">Perp</span>
                    </h1>
                </div>
                <div className="flex gap-4">
                    <MarketStats symbol={symbol} />
                </div>
            </section>

            {/* Pro Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
                {/* Left: Chart (Takes 3 cols) */}
                <div className="lg:col-span-3 h-full">
                    <CryptoChart symbol={symbol} />
                </div>

                {/* Right: Order Book & Predictions (Takes 1 col) */}
                <div className="lg:col-span-1 h-full">
                    <RightPanel symbol={symbol} />
                </div>
            </div>

            {/* Advanced Analytics */}
            <section>
                <h2 className="text-xl font-bold text-white mb-4">Deep Dive Analytics</h2>
                <AdvancedAnalytics symbol={symbol} />
            </section>

            {/* Bottom: Trading & Bot */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <PredictionCard symbol={symbol} />
                </div>
                <div className="md:col-span-1">
                    <TradeForm symbol={symbol} />
                </div>
                <div className="md:col-span-1">
                    <BotControl symbol={symbol} />
                </div>
            </div>
        </div>
    );
}
