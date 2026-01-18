"use client";

import { OrderBook } from "./OrderBook";
import { PredictionPanel } from "./PredictionPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface RightPanelProps {
    symbol: string;
}

export function RightPanel({ symbol }: RightPanelProps) {
    return (
        <Card className="h-[600px] bg-slate-950/50 border-white/5 backdrop-blur-xl flex flex-col overflow-hidden">
            <Tabs defaultValue="orderbook" className="flex-1 flex flex-col h-full">
                <div className="px-4 pt-3 pb-0">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-900/50">
                        <TabsTrigger value="orderbook">Order Book</TabsTrigger>
                        <TabsTrigger value="prediction">AI Analysis</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                    <TabsContent value="orderbook" className="h-full mt-0">
                        <OrderBook symbol={symbol} />
                    </TabsContent>
                    <TabsContent value="prediction" className="h-full mt-0 overflow-y-auto">
                        <PredictionPanel symbol={symbol} />
                    </TabsContent>
                </div>
            </Tabs>
        </Card>
    );
}
