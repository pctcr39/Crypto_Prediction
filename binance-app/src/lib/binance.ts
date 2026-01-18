
const BASE_URL = process.env.BINANCE_BASE_URL || 'https://api.binance.com';
const API_KEY = process.env.NEXT_PUBLIC_BINANCE_API_KEY || '';
const API_SECRET = process.env.BINANCE_API_SECRET || '';

async function sha256HMAC(message: string, secret: string) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(message)
    );
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

async function fetchPublic(endpoint: string, params: Record<string, any> = {}) {
    const url = new URL(BASE_URL + endpoint);
    Object.keys(params).forEach((key) =>
        url.searchParams.append(key, String(params[key]))
    );

    const res = await fetch(url.toString(), {
        headers: {
            'X-MBX-APIKEY': API_KEY,
        },
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }
    return res.json();
}

async function fetchSigned(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    params: Record<string, any> = {}
) {
    const timestamp = Date.now();
    const cleanParams: Record<string, any> = { ...params, timestamp };

    // Remove undefined/null values
    Object.keys(cleanParams).forEach(key =>
        (cleanParams[key] === undefined || cleanParams[key] === null) && delete cleanParams[key]
    );

    const queryString = new URLSearchParams(cleanParams).toString();
    const signature = await sha256HMAC(queryString, API_SECRET);

    const url = new URL(`${BASE_URL}${endpoint}?${queryString}&signature=${signature}`);

    const res = await fetch(url.toString(), {
        method,
        headers: {
            'X-MBX-APIKEY': API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }
    return res.json();
}

export const binanceClient = {
    // Public Endpoints
    time: async () => {
        const data = await fetchPublic('/api/v3/time');
        return data.serverTime;
    },
    exchangeInfo: async () => {
        return fetchPublic('/api/v3/exchangeInfo');
    },
    ticker24hr: async (symbol?: string) => {
        return fetchPublic('/api/v3/ticker/24hr', symbol ? { symbol } : {});
    },
    klines: async (symbol: string, interval: string, options: { limit?: number } = {}) => {
        // @binance/connector returns { data: [...] } structure in axios response usually?
        // Wait, the original code in route.ts did: response.data.map(...)
        // fetchPublic returns the array directly.
        // We need to mimic the response structure expected by the app consumers.

        // Checking src/app/api/history/route.ts: 
        // const response = await binanceClient.klines(...)
        // const data = response.data.map(...)

        // So we need to wrap the result in { data: ... } to match the old connector's axios response structure.
        const data = await fetchPublic('/api/v3/klines', { symbol, interval, ...options });
        return { data };
    },

    // Signed Endpoints
    newOrder: async (symbol: string, side: string, type: string, options: any = {}) => {
        return fetchSigned('/api/v3/order', 'POST', {
            symbol,
            side,
            type,
            ...options,
        });
    },
};
