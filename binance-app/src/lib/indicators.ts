export interface Candle {
    time: string | number; // Consistent with existing time usage or generic
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface Marker {
    time: string | number;
    position: 'aboveBar' | 'belowBar' | 'inBar';
    color: string;
    shape: 'circle' | 'square' | 'arrowUp' | 'arrowDown';
    text: string;
}

/**
 * Detects 'Anti-Gravity' zones:
 * 1. Long Lower Wick: (min(O,C) - L) > 2 * |O - C|
 * 2. Volume Spike: V > 1.5 * AvgVol(prev 5)
 */
export function calculateAntiGravityMarkers(candles: Candle[]): Marker[] {
    const markers: Marker[] = [];

    if (candles.length < 6) return markers;

    for (let i = 5; i < candles.length; i++) {
        const current = candles[i];
        const body = Math.abs(current.open - current.close);
        const lowerWick = Math.min(current.open, current.close) - current.low;

        // Calculate previous 5-candle average volume
        let sumVol = 0;
        for (let j = 1; j <= 5; j++) {
            sumVol += candles[i - j].volume;
        }
        const avgVol = sumVol / 5;

        // Check conditions
        const isLongLowerWick = lowerWick > (2 * body);
        const isVolumeSpike = current.volume > (1.5 * avgVol);

        if (isLongLowerWick && isVolumeSpike) {
            markers.push({
                time: current.time,
                position: 'belowBar',
                color: '#2196F3', // Blue for anti-gravity/support
                shape: 'arrowUp',
                text: 'AG',
            });
        }
    }

    return markers;
}
