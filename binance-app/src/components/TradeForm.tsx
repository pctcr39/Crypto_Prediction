"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Removed Input import as we are using native input with styles
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TradeFormProps {
    symbol?: string;
}

export function TradeForm({ symbol = "BTCUSDT" }: TradeFormProps) {
    const [amount, setAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleTrade = async (side: "BUY" | "SELL") => {
        if (!amount || isNaN(Number(amount))) {
            setMessage({ type: 'error', text: 'Please enter a valid amount' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol,
                    side,
                    type: 'MARKET',
                    // For simplicity, assuming US Dollar amount (quoteOrderQty) for BUY
                    // and Coin amount (quantity) for SELL. 
                    // BUT for a smooth demo let's just use quoteOrderQty for BUY and error for sell if not holding.
                    // To keep it simple: We'll send `quoteOrderQty` for BUY (spend USDT)
                    quoteOrderQty: side === 'BUY' ? amount : undefined,
                    // For SELL, typically we sell Quantity.
                    quantity: side === 'SELL' ? amount : undefined
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: `Success: ${side} order executed! ${data.msg || ''}` });
                setAmount("");
            } else {
                setMessage({ type: 'error', text: data.details || 'Trade failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error occurred' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="h-full border-white/5 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader>
                <CardTitle>Quick Trade ({symbol})</CardTitle>
                <CardDescription>Execute market orders instantly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400">Amount (USDT)</label>
                    {/* Simple Input using Tailwind directly to avoid dependency checks */}
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                        variant="default"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white w-full"
                        onClick={() => handleTrade("BUY")}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "BUY"}
                    </Button>
                    <Button
                        variant="default"
                        className="bg-rose-500 hover:bg-rose-600 text-white w-full"
                        onClick={() => handleTrade("SELL")}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SELL"}
                    </Button>
                </div>

                {message && (
                    <div className={cn(
                        "p-3 rounded-md text-xs font-medium mt-2",
                        message.type === 'success' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                        {message.text}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
