declare module '@binance/connector' {
    export class Spot {
        constructor(apiKey?: string, apiSecret?: string, options?: any);
        newOrder(symbol: string, side: string, type: string, options?: any): Promise<any>;
        // Add other methods as needed or use any for flexibility
        [key: string]: any;
    }
}
