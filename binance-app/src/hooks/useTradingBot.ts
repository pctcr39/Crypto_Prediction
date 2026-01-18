import { useState, useEffect, useRef } from 'react';

export interface BotLog {
    id: number;
    time: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
}

interface UseTradingBotProps {
    symbol: string;
    tradeAmount: string;
}

export function useTradingBot({ symbol, tradeAmount }: UseTradingBotProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<BotLog[]>([]);
    const [lastSignal, setLastSignal] = useState<string | null>(null);
    const logsRef = useRef<BotLog[]>([]);

    const addLog = (message: string, type: BotLog['type'] = 'info') => {
        const newLog = {
            id: Date.now(),
            time: new Date().toLocaleTimeString(),
            message,
            type
        };
        logsRef.current = [newLog, ...logsRef.current].slice(0, 50); // Keep last 50 logs
        setLogs(logsRef.current);
    };

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const runBotCycle = async () => {
            if (!isRunning) return;

            try {
                // 1. Fetch Prediction
                // addLog('Fetching prediction...', 'info'); 
                // Commented out to avoid log spam, only log important events

                const predRes = await fetch(`/api/prediction?symbol=${symbol}`);
                const predData = await predRes.json();

                if (!predData.signal) return;

                // 2. Analyze Signal
                if (predData.signal !== 'NEUTRAL' && predData.signal !== lastSignal) {
                    addLog(`Signal Detected: ${predData.signal} (RSI: ${predData.rsi.toFixed(2)})`, 'warning');

                    // 3. Execute Trade
                    addLog(`Executing ${predData.signal} Order...`, 'info');

                    const tradeRes = await fetch('/api/trade', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            symbol,
                            side: predData.signal,
                            quoteOrderQty: predData.signal === 'BUY' ? tradeAmount : undefined,
                            quantity: predData.signal === 'SELL' ? tradeAmount : undefined, // Simplification
                        }),
                    });

                    const tradeData = await tradeRes.json();

                    if (tradeRes.ok) {
                        addLog(`Order Executed: ${tradeData.side} @ ${tradeData.price}`, 'success');
                        setLastSignal(predData.signal); // Prevent double trading on same signal
                    } else {
                        addLog(`Trade Failed: ${tradeData.details || tradeData.error}`, 'error');
                    }
                }
            } catch (error) {
                addLog('Bot Cycle Error: Network/API Issue', 'error');
            }
        };

        if (isRunning) {
            addLog(`Bot Started. Monitoring ${symbol}...`, 'success');
            // Run immediately then interval
            runBotCycle();
            intervalId = setInterval(runBotCycle, 10000); // Check every 10 seconds
        } else {
            if (logs.length > 0 && logs[0].message.includes('Bot Started')) {
                addLog('Bot Stopped.', 'warning');
            }
        }

        return () => clearInterval(intervalId);
    }, [isRunning, symbol, tradeAmount, lastSignal]);

    return { isRunning, setIsRunning, logs, clearLogs: () => setLogs([]) };
}
