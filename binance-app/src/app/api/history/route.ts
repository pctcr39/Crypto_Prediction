import { NextResponse } from 'next/server';
import { binanceClient } from '@/lib/binance';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        // Fetch kline data (candlestick data)
        const interval = searchParams.get('interval') || '1h';
        const limitStr = searchParams.get('limit') || '50';
        const limit = parseInt(limitStr);

        const response = await binanceClient.klines(symbol, interval, { limit });

        // Optimized Mapping: Avoid server-side Date formatting. Send raw timestamps.
        const data = response.data.map((k: any) => ({
            time: k[0], // Send raw timestamp (number)
            rawTime: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
            price: parseFloat(k[4]),
        }));

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=55',
            },
        });
    } catch (error: any) {
        console.error('Binance API Error:', error?.response?.data || error.message);
        return NextResponse.json(
            { error: 'Failed to fetch data' },
            { status: 500 }
        );
    }
}
