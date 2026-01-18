import { RSI, SMA, EMA, MACD } from 'technicalindicators';

export interface CandleData {
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export type Signal = 'BUY' | 'SELL' | 'NEUTRAL';

export class TechnicalAnalysis {
    /**
     * Calculate RSI (Relative Strength Index)
     * @param closes Array of closing prices
     * @param period Period for RSI (default 14)
     */
    static calculateRSI(closes: number[], period: number = 14): number[] {
        return RSI.calculate({ values: closes, period });
    }

    /**
     * Calculate Simple Moving Average
     */
    static calculateSMA(closes: number[], period: number = 20): number[] {
        return SMA.calculate({ values: closes, period });
    }

    /**
     * Calculate Exponential Moving Average
     */
    static calculateEMA(closes: number[], period: number = 20): number[] {
        return EMA.calculate({ values: closes, period });
    }

    /**
     * Generate a simple trading signal based on RSI and EMA crossover
     * Strategy:
     * - BUY if RSI < 30 (Oversold) OR (Price > EMA20 and RSI > 50)
     * - SELL if RSI > 70 (Overbought) OR (Price < EMA20 and RSI < 50)
     * - NEUTRAL otherwise
     */
    static analyze(closes: number[]): { signal: Signal; rsi: number; trend: 'UP' | 'DOWN' | 'SIDEWAYS' } {
        if (closes.length < 50) {
            throw new Error('Insufficient data for analysis');
        }

        const rsiValues = this.calculateRSI(closes);
        const emaValues = this.calculateEMA(closes, 20);

        // Get latest values
        const currentRSI = rsiValues[rsiValues.length - 1];
        const currentEMA = emaValues[emaValues.length - 1];
        const currentPrice = closes[closes.length - 1];
        const prevPrice = closes[closes.length - 2];

        let signal: Signal = 'NEUTRAL';

        // Simple mean reversion + trend following logic
        if (currentRSI < 30) {
            signal = 'BUY'; // Oversold
        } else if (currentRSI > 70) {
            signal = 'SELL'; // Overbought
        } else {
            // Trend confirmation
            if (currentPrice > currentEMA && currentRSI > 55) {
                signal = 'BUY';
            } else if (currentPrice < currentEMA && currentRSI < 45) {
                signal = 'SELL';
            }
        }

        const trend = currentPrice > currentEMA ? 'UP' : (currentPrice < currentEMA ? 'DOWN' : 'SIDEWAYS');

        return {
            signal,
            rsi: currentRSI,
            trend
        };
    }
}
