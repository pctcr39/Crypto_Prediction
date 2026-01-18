import { useEffect, useState, useRef } from 'react';

interface TickerData {
    symbol: string;
    price: string;
    changePercent: string;
}

export function useBinanceWebSocket(symbols: string[]) {
    const [tickerData, setTickerData] = useState<Record<string, TickerData>>({});
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Binance Stream format: <symbol>@ticker
        // Combined streams: /stream?streams=<symbol>@ticker/<symbol>@ticker
        const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/');
        const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            // console.log('Connected to Binance WS');
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                // message format: { stream: 'btcusdt@ticker', data: { s: 'BTCUSDT', c: 'price', P: 'percent' ... } }
                if (message.data) {
                    const { s: symbol, c: price, P: changePercent } = message.data;
                    setTickerData(prev => ({
                        ...prev,
                        [symbol]: { symbol, price, changePercent }
                    }));
                }
            } catch (e) {
                console.error('WS Parse Error', e);
            }
        };

        ws.onclose = () => {
            // console.log('Binance WS Closed');
        };

        return () => {
            ws.close();
        };
    }, [JSON.stringify(symbols)]); // Re-connect if symbols change

    return tickerData;
}
