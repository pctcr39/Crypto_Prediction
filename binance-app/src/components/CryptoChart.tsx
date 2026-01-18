"use client";

import { useEffect, useState } from "react";
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Bar,
    Cell,
    Area,
    Brush
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { calculateAntiGravityMarkers, Candle } from "@/lib/indicators";

interface ChartDataPoint extends Candle {
    ma7?: number;
    ma25?: number;
    ma99?: number;
    bbUpper?: number;
    bbMiddle?: number;
    bbLower?: number;
    candleRange?: [number, number];
    isGreen?: boolean;
}

const TIMEFRAMES = [
    { label: "15m", value: "15m" },
    { label: "1H", value: "1h" },
    { label: "4H", value: "4h" },
    { label: "1D", value: "1d" },
    { label: "1W", value: "1w" },
];

// Calculate Simple Moving Average
const calculateSMA = (data: Candle[], period: number): (number | undefined)[] => {
    return data.map((_, index) => {
        if (index < period - 1) return undefined;
        const sum = data.slice(index - period + 1, index + 1).reduce((acc, d) => acc + d.close, 0);
        return sum / period;
    });
};

// Calculate Bollinger Bands
const calculateBollingerBands = (data: Candle[], period: number = 20, stdDev: number = 2) => {
    return data.map((_, index) => {
        if (index < period - 1) return { upper: undefined, middle: undefined, lower: undefined };

        const slice = data.slice(index - period + 1, index + 1);
        const mean = slice.reduce((acc, d) => acc + d.close, 0) / period;
        const variance = slice.reduce((acc, d) => acc + Math.pow(d.close - mean, 2), 0) / period;
        const sd = Math.sqrt(variance);

        return {
            upper: mean + (sd * stdDev),
            middle: mean,
            lower: mean - (sd * stdDev)
        };
    });
};

// Custom Candlestick Shape Component
const CandlestickShape = (props: any) => {
    const { x, y, width, height, payload } = props;

    if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) {
        return null;
    }

    const { open, close, high, low } = payload;
    const isGreen = close >= open;
    const color = isGreen ? "#0ECB81" : "#F6465D";

    // Calculate the price range and pixel ratio
    const priceRange = high - low;
    if (priceRange === 0) return null;

    const pixelPerPrice = height / priceRange;

    // Calculate body dimensions
    const bodyTop = Math.max(open, close);
    const bodyBottom = Math.min(open, close);
    const bodyHeight = Math.max((bodyTop - bodyBottom) * pixelPerPrice, 1);
    const bodyY = y + ((high - bodyTop) * pixelPerPrice);

    const wickX = x + width / 2;

    return (
        <g>
            <line x1={wickX} y1={y} x2={wickX} y2={bodyY} stroke={color} strokeWidth={1} />
            <rect x={x} y={bodyY} width={width} height={bodyHeight} fill={color} stroke={color} strokeWidth={0} />
            <line x1={wickX} y1={bodyY + bodyHeight} x2={wickX} y2={y + height} stroke={color} strokeWidth={1} />
        </g>
    );
};

// Funding Rate Countdown Component
function FundingCountdown() {
    const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [fundingRate, setFundingRate] = useState(0.01000);

    useEffect(() => {
        const calculateCountdown = () => {
            const now = new Date();
            const hours = now.getUTCHours();

            // Next funding time (00:00, 08:00, or 16:00 UTC)
            let nextFundingHour = 0;
            if (hours < 8) nextFundingHour = 8;
            else if (hours < 16) nextFundingHour = 16;
            else nextFundingHour = 24;

            const nextFunding = new Date(now);
            nextFunding.setUTCHours(nextFundingHour === 24 ? 0 : nextFundingHour, 0, 0, 0);
            if (nextFundingHour === 24) {
                nextFunding.setUTCDate(nextFunding.getUTCDate() + 1);
            }

            const diff = nextFunding.getTime() - now.getTime();
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown({ hours: h, minutes: m, seconds: s });
        };

        calculateCountdown();
        const interval = setInterval(calculateCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (num: number) => String(num).padStart(2, '0');

    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="text-[#848E9C]">Funding (8h)</span>
            <span className={fundingRate >= 0 ? "text-[#0ECB81]" : "text-[#F6465D]"}>
                {fundingRate >= 0 ? '+' : ''}{(fundingRate * 100).toFixed(4)}%
            </span>
            <span className="text-[#848E9C]">/</span>
            <span className="text-[#FCD535] font-mono">
                {formatTime(countdown.hours)}:{formatTime(countdown.minutes)}:{formatTime(countdown.seconds)}
            </span>
        </div>
    );
}

export function CryptoChart({ symbol }: { symbol: string }) {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [interval, setChartInterval] = useState("1d");
    const [showMA, setShowMA] = useState(true);
    const [showBB, setShowBB] = useState(false);

    const formatXAxis = (timestamp: number) => {
        const date = new Date(timestamp);
        if (['1d', '3d', '1w', '1M'].includes(interval)) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatTooltipLabel = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/history?symbol=${symbol}&interval=${interval}&limit=100`);
                const json: any[] = await res.json();

                if (Array.isArray(json) && json.length > 0) {
                    const candles: Candle[] = json.map(item => ({
                        time: item.rawTime || item.time,
                        open: item.open,
                        high: item.high,
                        low: item.low,
                        close: item.close,
                        volume: item.volume
                    }));

                    const ma7 = calculateSMA(candles, 7);
                    const ma25 = calculateSMA(candles, 25);
                    const ma99 = calculateSMA(candles, 99);
                    const bb = calculateBollingerBands(candles, 20, 2);
                    const markers = calculateAntiGravityMarkers(candles);

                    const processedData: ChartDataPoint[] = json.map((item, index) => {
                        const marker = markers.find(m => m.time === (item.rawTime || item.time));
                        const isGreen = item.close >= item.open;

                        return {
                            time: item.rawTime || item.time,
                            open: item.open,
                            high: item.high,
                            low: item.low,
                            close: item.close,
                            volume: item.volume,
                            candleRange: [item.low, item.high],
                            isGreen,
                            ma7: ma7[index],
                            ma25: ma25[index],
                            ma99: ma99[index],
                            bbUpper: bb[index].upper,
                            bbMiddle: bb[index].middle,
                            bbLower: bb[index].lower,
                            marker: marker ? item.low * 0.995 : undefined,
                            markerColor: marker?.color
                        };
                    });

                    setData(processedData);
                }
            } catch (error) {
                console.error("Failed to fetch chart data:", error);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        fetchData();
        const interval_id = setInterval(fetchData, 60000);
        return () => clearInterval(interval_id);
    }, [symbol, interval]);

    if (loading && data.length === 0) {
        return (
            <Card className="h-[600px] bg-[#161a1e] border-[#2B2F36] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#FCD535] animate-spin" />
            </Card>
        );
    }

    const latestData = data[data.length - 1];
    const totalVolumeBTC = data.reduce((sum, d) => sum + d.volume, 0);
    const totalVolumeUSDT = data.reduce((sum, d) => sum + (d.volume * d.close), 0);

    return (
        <Card className="h-[600px] bg-[#161a1e] border-[#2B2F36] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#161a1e] border-b border-[#2B2F36]">
                <div className="flex items-center gap-6">
                    {/* Timeframe Selector */}
                    <div className="flex items-center gap-2">
                        {TIMEFRAMES.map((tf) => (
                            <button
                                key={tf.value}
                                onClick={() => setChartInterval(tf.value)}
                                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${interval === tf.value
                                    ? 'bg-[#FCD535] text-[#161a1e]'
                                    : 'text-[#848E9C] hover:text-[#EAECEF]'
                                    }`}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>

                    <div className="h-4 w-px bg-[#2B2F36]" />

                    {/* Indicators */}
                    <div className="flex items-center gap-3 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showMA}
                                onChange={() => setShowMA(!showMA)}
                                className="w-3.5 h-3.5 rounded accent-[#FCD535]"
                            />
                            <span className={showMA ? 'text-[#FCD535]' : 'text-[#848E9C]'}>MA</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showBB}
                                onChange={() => setShowBB(!showBB)}
                                className="w-3.5 h-3.5 rounded accent-[#FCD535]"
                            />
                            <span className={showBB ? 'text-[#FCD535]' : 'text-[#848E9C]'}>BB</span>
                        </label>
                    </div>

                    <div className="h-4 w-px bg-[#2B2F36]" />

                    {/* Funding Rate */}
                    <FundingCountdown />
                </div>
            </div>

            {/* Chart Area */}
            <CardContent className="flex-1 relative p-0">
                {/* MA Legend */}
                {showMA && latestData && (
                    <div className="absolute top-3 left-3 z-10 flex gap-4 text-[10px] font-mono select-none">
                        {latestData.ma7 && (
                            <span className="text-[#F0B90B]">MA(7): {latestData.ma7.toFixed(2)}</span>
                        )}
                        {latestData.ma25 && (
                            <span className="text-[#E84393]">MA(25): {latestData.ma25.toFixed(2)}</span>
                        )}
                        {latestData.ma99 && (
                            <span className="text-[#00D4AA]">MA(99): {latestData.ma99.toFixed(2)}</span>
                        )}
                    </div>
                )}

                {/* Volume Stats Overlay */}
                <div className="absolute bottom-16 left-3 z-10 flex gap-4 text-[10px] select-none">
                    <span className="text-[#848E9C]">
                        Vol({symbol.replace('USDT', '')}): <span className="text-[#EAECEF]">{(totalVolumeBTC / 1000).toFixed(2)}K</span>
                    </span>
                    <span className="text-[#848E9C]">
                        Vol(USDT): <span className="text-[#EAECEF]">{(totalVolumeUSDT / 1000000).toFixed(2)}M</span>
                    </span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="bbGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2962FF" stopOpacity={0.1} />
                                <stop offset="100%" stopColor="#2962FF" stopOpacity={0.01} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid stroke="#2B2F36" strokeDasharray="3 3" vertical={false} />

                        <XAxis
                            dataKey="time"
                            stroke="#848E9C"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={50}
                            tickFormatter={formatXAxis}
                        />

                        <YAxis
                            yAxisId="price"
                            orientation="right"
                            stroke="#848E9C"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            domain={['auto', 'auto']}
                            tickFormatter={(val) => val.toFixed(2)}
                            width={65}
                        />

                        <YAxis
                            yAxisId="volume"
                            orientation="left"
                            hide={true}
                            domain={[0, 'dataMax * 5']}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1E2329',
                                border: '1px solid #2B2F36',
                                borderRadius: '4px',
                                fontSize: '12px'
                            }}
                            labelStyle={{ color: '#848E9C', marginBottom: '4px' }}
                            labelFormatter={formatTooltipLabel}
                            cursor={{ stroke: '#848E9C', strokeWidth: 1, strokeDasharray: '4 4' }}
                            formatter={(value: any, name: any) => {
                                if (name === 'candleRange') return [null, null];
                                if (typeof value === 'number') {
                                    return [value.toFixed(2), name.toUpperCase()];
                                }
                                return [value, name];
                            }}
                        />

                        {/* Interactive Zoom Brush */}
                        <Brush
                            dataKey="time"
                            height={30}
                            stroke="#848E9C"
                            fill="#161a1e"
                            tickFormatter={() => ''}
                            y={550}
                        />

                        {/* Bollinger Bands */}
                        {showBB && (
                            <>
                                <Area
                                    yAxisId="price"
                                    type="monotone"
                                    dataKey="bbUpper"
                                    stroke="none"
                                    fill="url(#bbGradient)"
                                    fillOpacity={1}
                                />
                                <Area
                                    yAxisId="price"
                                    type="monotone"
                                    dataKey="bbLower"
                                    stroke="none"
                                    fill="none"
                                />
                                <Line
                                    yAxisId="price"
                                    type="monotone"
                                    dataKey="bbUpper"
                                    stroke="#2962FF"
                                    strokeWidth={1}
                                    dot={false}
                                    strokeOpacity={0.6}
                                />
                                <Line
                                    yAxisId="price"
                                    type="monotone"
                                    dataKey="bbMiddle"
                                    stroke="#2962FF"
                                    strokeWidth={1}
                                    dot={false}
                                    strokeOpacity={0.3}
                                    strokeDasharray="3 3"
                                />
                                <Line
                                    yAxisId="price"
                                    type="monotone"
                                    dataKey="bbLower"
                                    stroke="#2962FF"
                                    strokeWidth={1}
                                    dot={false}
                                    strokeOpacity={0.6}
                                />
                            </>
                        )}

                        {/* Candlesticks */}
                        <Bar
                            yAxisId="price"
                            dataKey="candleRange"
                            shape={<CandlestickShape />}
                            isAnimationActive={false}
                        />

                        {/* Moving Averages */}
                        {showMA && (
                            <>
                                <Line
                                    yAxisId="price"
                                    type="monotone"
                                    dataKey="ma7"
                                    stroke="#F0B90B"
                                    strokeWidth={1.5}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    yAxisId="price"
                                    type="monotone"
                                    dataKey="ma25"
                                    stroke="#E84393"
                                    strokeWidth={1.5}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <Line
                                    yAxisId="price"
                                    type="monotone"
                                    dataKey="ma99"
                                    stroke="#00D4AA"
                                    strokeWidth={1.5}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            </>
                        )}

                        {/* Volume Bars - Color matched to candle direction */}
                        <Bar
                            yAxisId="volume"
                            dataKey="volume"
                            isAnimationActive={false}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.isGreen ? "#0ECB81" : "#F6465D"} opacity={0.5} />
                            ))}
                        </Bar>
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
