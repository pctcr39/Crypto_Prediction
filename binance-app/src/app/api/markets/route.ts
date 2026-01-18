import { NextResponse } from 'next/server';
import { binanceClient } from '@/lib/binance';

export async function GET() {
    try {
        // 1. Fetch Spot Markets via Client
        const spotInfo = await binanceClient.exchangeInfo();
        const spotSymbols = spotInfo.data.symbols
            .filter((s: any) => s.status === 'TRADING')
            .map((s: any) => ({
                symbol: s.symbol,
                base: s.baseAsset,
                quote: s.quoteAsset,
                type: 'SPOT'
            }));

        // 2. Fetch Futures Markets via Public API (fapi)
        // We use direct fetch for Futures to avoid messing with the existing singleton for now
        const futuresRes = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo');
        const futuresJson = await futuresRes.json();
        const futuresSymbols = futuresJson.symbols
            .filter((s: any) => s.status === 'TRADING')
            .map((s: any) => ({
                symbol: s.symbol,
                base: s.baseAsset,
                quote: s.quoteAsset,
                type: 'FUTURE'
            }));

        // Combine and Sort
        // We prefer USDT pairs for the demo
        const allSymbols = [...futuresSymbols, ...spotSymbols].sort((a, b) => {
            // Prioritize USDT pairs
            const aUSDT = a.symbol.endsWith('USDT');
            const bUSDT = b.symbol.endsWith('USDT');
            if (aUSDT && !bUSDT) return -1;
            if (!aUSDT && bUSDT) return 1;
            return a.symbol.localeCompare(b.symbol);
        });

        return NextResponse.json(allSymbols);
    } catch (error: any) {
        console.error('Market API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch markets' },
            { status: 500 }
        );
    }
}
