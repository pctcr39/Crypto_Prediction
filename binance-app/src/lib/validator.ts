export interface ValidationResult {
    symbol: string;
    predicted: number;
    actual: number;
    accuracy: number; // 0-100%
    timestamp: number;
}

export function validatePrediction(predicted: number, actual: number): ValidationResult {
    // Determine the deviation
    const diff = Math.abs(predicted - actual);
    const deviation = diff / actual;

    // Accuracy = 100 - deviation percentage (clamped at 0)
    let accuracy = (1 - deviation) * 100;
    if (accuracy < 0) accuracy = 0;

    return {
        symbol: "TEST",
        predicted,
        actual,
        accuracy: parseFloat(accuracy.toFixed(2)),
        timestamp: Date.now()
    };
}
