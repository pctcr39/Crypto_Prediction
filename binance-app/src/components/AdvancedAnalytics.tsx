"use client";

import { TechnicalAnalysisChart } from "./TechnicalAnalysisChart";
import { FundingRateChart } from "./FundingRateChart";

export function AdvancedAnalytics({ symbol }: { symbol: string }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TechnicalAnalysisChart symbol={symbol} />
            <FundingRateChart symbol={symbol} />
        </div>
    );
}
