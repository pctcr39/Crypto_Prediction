import { NextResponse } from 'next/server';

export const runtime = 'edge';

import { binanceClient } from '@/lib/binance';
import { TechnicalAnalysis, Signal } from '@/lib/technical-analysis';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTCUSDT';
    const interval = searchParams.get('interval') || '1h';

    try {
        // Fetch klines (candlestick data) from Binance
        // Limit 100 to get enough data for EMA/RSI (need at least 20-50)
        const klines = await binanceClient.klines(symbol, interval, { limit: 100 });

        // Binance returns array of arrays: 
        // [ [ Open Time, Open, High, Low, Close, Volume, ... ], ... ]
        // We strictly need numbers for technical analysis
        const closes = klines.data.map((k: any[]) => parseFloat(k[4]));

        const analysis = TechnicalAnalysis.analyze(closes);
        const currentPrice = closes[closes.length - 1];

        return NextResponse.json({
            symbol,
            price: currentPrice,
            ...analysis,
            timestamp: Date.now()
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=59',
            },
        });

    } catch (error: any) {
        console.error('Prediction API Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate prediction', details: error.message },
            { status: 500 }
        );
    }
}
