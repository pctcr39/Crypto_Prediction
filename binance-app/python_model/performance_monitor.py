import pandas as pd
import numpy as np
from typing import List, Dict, Union, Optional
from sklearn.metrics import precision_score, recall_score, accuracy_score, confusion_matrix

class PerformanceMonitor:
    """
    A comprehensive performance tracker for quantitative trading strategies.
    Calculates both Financial Metrics (PnL, Drawdown, Sharpe) and ML Metrics.
    """

    def __init__(self):
        pass

    def calculate_report(self, 
                         trades: List[Dict], 
                         predictions: Optional[List[int]] = None, 
                         actuals: Optional[List[int]] = None) -> Dict:
        """
        Generates a full performance report.

        Args:
            trades: List of dicts, e.g. [{'entry_price': 100, 'exit_price': 105, 'side': 'buy', 'size': 1, 'commission': 0.1}, ...]
            predictions: List of Class labels (0, 1, 2)
            actuals: List of True Class labels (0, 1, 2)
        
        Returns:
            Dictionary containing 'financial_metrics' and 'ml_metrics'.
        """
        report = {
            'financial_metrics': self._calculate_financial_metrics(trades),
            'ml_metrics': {}
        }

        if predictions is not None and actuals is not None:
            report['ml_metrics'] = self._calculate_ml_metrics(predictions, actuals)
        
        return report

    def _calculate_financial_metrics(self, trades: List[Dict]) -> Dict:
        if not trades:
            return {
                'total_net_profit': 0.0,
                'win_rate': 0.0,
                'profit_factor': 0.0,
                'max_drawdown': 0.0,
                'sharpe_ratio': 0.0,
                'total_trades': 0
            }

        df = pd.DataFrame(trades)
        
        # 1. Calculate Gross Profit per trade
        # For Long (Buy): (Exit - Entry) * Size
        # For Short (Sell): (Entry - Exit) * Size
        # Adjust logic if 'size' is contract value or quantity. Assuming Quantity here.
        
        def calculate_pnl(row):
            if row['side'].lower() == 'buy':
                return (row['exit_price'] - row['entry_price']) * row['size']
            else:
                return (row['entry_price'] - row['exit_price']) * row['size']

        df['gross_pnl'] = df.apply(calculate_pnl, axis=1)
        df['net_pnl'] = df['gross_pnl'] - df.get('commission', 0)

        # 2. Total Net Profit
        total_net_profit = df['net_pnl'].sum()

        # 3. Win Rate
        winners = df[df['net_pnl'] > 0]
        win_rate = (len(winners) / len(df)) * 100 if len(df) > 0 else 0

        # 4. Profit Factor
        gross_profit = df[df['net_pnl'] > 0]['net_pnl'].sum()
        gross_loss = abs(df[df['net_pnl'] < 0]['net_pnl'].sum())
        profit_factor = gross_profit / gross_loss if gross_loss != 0 else float('inf')

        # 5. Max Drawdown
        # Construct equity curve starting from 0 (or initial capital if provided, but relative works for DD %)
        # We need relative percentage drawdown, which usually requires base capital. 
        # Assuming cumulative PnL represents the equity growth on top of a base.
        # Alternatively, calculate DD on the *accumulated profit* curve.
        
        df['cumulative_pnl'] = df['net_pnl'].cumsum()
        df['peak_equity'] = df['cumulative_pnl'].cummax()
        
        # DD is usually (Peak - Current) / Peak for percentage, but if Peak is 0...
        # Standard approach for absolute DD: Peak - Current
        # Percentage DD requires a starting balance. We will return Absolute DD for robustness 
        # unless we assume a starting capital. Let's return ABSOLUTE Max Drawdown here to be safe without assumtions.
        
        df['drawdown'] = df['peak_equity'] - df['cumulative_pnl']
        max_drawdown = df['drawdown'].max()

        # 6. Sharpe Ratio
        # Annualized Sharpe = mean(returns) / std(returns) * sqrt(252 or 365)
        # We calculate per-trade Sharpe here effectively (Risk Adjusted Return)
        pnl_std = df['net_pnl'].std()
        avg_pnl = df['net_pnl'].mean()
        # Using a simplistic Sharpe proxy (Avg PnL / Std Dev)
        sharpe = avg_pnl / pnl_std if pnl_std != 0 else 0

        return {
            'total_net_profit': round(total_net_profit, 2),
            'win_rate': round(win_rate, 2),
            'profit_factor': round(profit_factor, 2),
            'max_drawdown': round(max_drawdown, 2),
            'sharpe_ratio': round(sharpe, 4),
            'total_trades': len(df)
        }

    def _calculate_ml_metrics(self, predictions: List[int], actuals: List[int]) -> Dict:
        """
        Calculates classification metrics.
        Labels: 0 (Sell), 1 (Hold), 2 (Buy)
        """
        # Ensure numpy arrays
        y_pred = np.array(predictions)
        y_true = np.array(actuals)
        
        # Calculate standard metrics
        # 'macro' average treats all classes equally
        # 'weighted' accounts for class imbalance
        
        accuracy = accuracy_score(y_true, y_pred)
        precision = precision_score(y_true, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_true, y_pred, average='weighted', zero_division=0)
        
        # To get specific Buy/Sell precision (Class 0 and 2), we can do:
        # precision_per_class = precision_score(y_true, y_pred, average=None)
        
        return {
            'accuracy': round(accuracy * 100, 2),
            'precision': round(precision * 100, 2),
            'recall': round(recall * 100, 2)
        }

# Example Usage
if __name__ == "__main__":
    monitor = PerformanceMonitor()
    
    # Mock Trades
    mock_trades = [
        {'entry_price': 50000, 'exit_price': 51000, 'side': 'buy', 'size': 0.1, 'commission': 5}, # +$95
        {'entry_price': 51000, 'exit_price': 50500, 'side': 'buy', 'size': 0.1, 'commission': 5}, # -$55
        {'entry_price': 50500, 'exit_price': 50000, 'side': 'sell', 'size': 0.1, 'commission': 5} # +$45
    ]
    
    # Mock ML
    mock_preds = [2, 1, 0, 2, 2] # Buy, Hold, Sell...
    mock_actuals = [2, 1, 1, 0, 2]
    
    report = monitor.calculate_report(mock_trades, mock_preds, mock_actuals)
    print("Financials:", report['financial_metrics'])
    print("ML Metrics:", report['ml_metrics'])
