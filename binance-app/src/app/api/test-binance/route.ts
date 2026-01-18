import { NextResponse } from 'next/server';

export const runtime = 'edge';

import { binanceClient } from '@/lib/binance';

export async function GET() {
    try {
        // Test connectivity by fetching server time or exchange info
        // Using a public endpoint that doesn't strictly require auth if keys are empty (for Public data)
        // But connector might throw if keys are invalid. 
        // We'll try fetching Time which is a very basic public endpoint.

        // The connector uses callbacks or promises. It supports promises.
        const response = await binanceClient.time();

        return NextResponse.json({
            status: 'success',
            data: response.data,
            message: 'Successfully connected to Binance API'
        });
    } catch (error: any) {
        console.error('Binance API Connection Error:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: 'Failed to connect to Binance API',
                error: error.message
            },
            { status: 500 }
        );
    }
}
