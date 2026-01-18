import { NextResponse } from 'next/server';
import { binanceClient } from '@/lib/binance';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { symbol, side, type = 'MARKET', quantity, quoteOrderQty } = body;

        if (!symbol || !side) {
            return NextResponse.json(
                { error: 'Missing symbol or side' },
                { status: 400 }
            );
        }

        // SIMULATION MODE: If no API keys are set, or for safety in this demo
        if (!process.env.NEXT_PUBLIC_BINANCE_API_KEY) {
            // Simulate a successful trade
            await new Promise(resolve => setTimeout(resolve, 1000));
            return NextResponse.json({
                status: 'EXECUTED',
                symbol,
                side,
                executedQty: quantity || '0.001',
                cummulativeQuoteQty: quoteOrderQty || '100.00',
                price: '95000.00',
                orderId: Date.now(),
                msg: 'Simulation Mode: Order executed successfully (No API Key found)'
            });
        }

        // Real Execution
        const options: any = {};
        if (quantity) options.quantity = quantity;
        if (quoteOrderQty) options.quoteOrderQty = quoteOrderQty;

        // binance-connector typescript definitions might vary, using 'any' cast if needed or method directly
        // newOrder method signature: (symbol, side, type, options)
        const response = await binanceClient.newOrder(symbol, side, type, options);

        return NextResponse.json(response.data);

    } catch (error: any) {
        console.error('Trade Execution Error:', error?.response?.data || error.message);
        return NextResponse.json(
            {
                error: 'Trade failed',
                details: error?.response?.data?.msg || error.message
            },
            { status: 500 }
        );
    }
}
