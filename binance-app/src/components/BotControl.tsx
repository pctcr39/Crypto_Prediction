"use client";

import { useState } from "react";
import { useTradingBot } from "@/hooks/useTradingBot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Square, Activity, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BotControlProps {
    symbol?: string;
}

export function BotControl({ symbol = "BTCUSDT" }: BotControlProps) {
    const [tradeAmount, setTradeAmount] = useState("100"); // Default $100
    const { isRunning, setIsRunning, logs, clearLogs } = useTradingBot({ symbol, tradeAmount });

    return (
        <Card className="h-full border-white/5 bg-slate-900/50 backdrop-blur-xl flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className={cn("w-5 h-5", isRunning ? "text-emerald-500 animate-pulse" : "text-slate-500")} />
                            Auto-Trading Bot
                        </CardTitle>
                        <CardDescription>Automated strategy execution</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={isRunning ? "destructive" : "default"}
                            size="sm"
                            className={cn(isRunning ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600")}
                            onClick={() => setIsRunning(!isRunning)}
                        >
                            {isRunning ? <><Square className="w-4 h-4 mr-2" /> Stop</> : <><Play className="w-4 h-4 mr-2" /> Start</>}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 flex-1 flex flex-col overflow-hidden">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400">Trade Amount per Signal (USDT)</label>
                    <input
                        type="number"
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        disabled={isRunning}
                        className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-white focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    />
                </div>

                <div className="flex-1 flex flex-col min-h-[200px] border border-slate-800 rounded-md bg-slate-950/50 overflow-hidden">
                    <div className="flex justify-between items-center p-2 border-b border-slate-800 bg-slate-900/50">
                        <span className="text-xs font-medium text-slate-400">Activity Log</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-white" onClick={clearLogs}>
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
                        {logs.length === 0 && <div className="text-slate-600 italic text-center py-4">Waiting for activity...</div>}

                        {logs.map((log) => (
                            <div key={log.id} className="flex gap-2">
                                <span className="text-slate-500">[{log.time}]</span>
                                <span className={cn(
                                    log.type === 'success' ? 'text-emerald-400' :
                                        log.type === 'error' ? 'text-rose-400' :
                                            log.type === 'warning' ? 'text-amber-400' : 'text-slate-300'
                                )}>
                                    {log.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
