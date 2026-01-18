import { NextResponse } from 'next/server';
import { binanceClient } from '@/lib/binance';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        const response = await binanceClient.ticker24hr(symbol);
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to fetch ticker data' },
            { status: 500 }
        );
    }
}
