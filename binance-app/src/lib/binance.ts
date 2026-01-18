import { Spot } from '@binance/connector';

// Define global type for caching the instance in development
const globalForBinance = global as unknown as { binanceClient: Spot };

export const binanceClient =
    globalForBinance.binanceClient ||
    new Spot(
        process.env.NEXT_PUBLIC_BINANCE_API_KEY,
        process.env.BINANCE_API_SECRET,
        {
            baseURL: process.env.BINANCE_BASE_URL || 'https://api.binance.com',
        }
    );

if (process.env.NODE_ENV !== 'production') {
    globalForBinance.binanceClient = binanceClient;
}
