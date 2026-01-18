import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import pandas as pd
from typing import Tuple, Optional

class TripleBarrierLabeling:
    """
    Implements the Triple Barrier Method for labeling financial time series.
    Labels: 0 (Sell), 1 (Hold), 2 (Buy)
    """
    def __init__(self, 
                 pt_multiplier: float = 2.0, 
                 sl_multiplier: float = 2.0, 
                 horizon_bars: int = 50):
        """
        Args:
            pt_multiplier: Profit-Take multiplier (multiplied by volatility).
            sl_multiplier: Stop-Loss multiplier (multiplied by volatility).
            horizon_bars: Max holding period (vertical barrier).
        """
        self.pt = pt_multiplier
        self.sl = sl_multiplier
        self.horizon = horizon_bars

    def get_volatility(self, close_prices: pd.Series, span: int = 100) -> pd.Series:
        """
        Computes daily volatility using EWMA of returns.
        """
        # Simple returns
        returns = close_prices.pct_change()
        # EWMA standard deviation
        vol = returns.ewm(span=span).std()
        return vol

    def apply_barriers(self, 
                       close_prices: pd.Series, 
                       volatility: pd.Series) -> pd.Series:
        """
        Generates labels based on Triple Barrier method.
        """
        labels = pd.Series(index=close_prices.index, data=1) # Default to Hold (1)
        
        # We iterate through the series (inefficient but clear for structure)
        # In production, this should be vectorized or compiled with Numba
        
        for t in range(len(close_prices) - self.horizon):
            price_t = close_prices.iloc[t]
            vol_t = volatility.iloc[t]
            
            upper_barrier = price_t * (1 + self.pt * vol_t)
            lower_barrier = price_t * (1 - self.sl * vol_t)
            
            # Future window
            window = close_prices.iloc[t+1 : t+self.horizon+1]
            
            # Check for barriers
            touch_upper = window[window >= upper_barrier].index.min()
            touch_lower = window[window <= lower_barrier].index.min()
            
            label = 1 # Hold
            
            if pd.notna(touch_upper) and pd.notna(touch_lower):
                if touch_upper < touch_lower:
                    label = 2 # Buy
                else:
                    label = 0 # Sell
            elif pd.notna(touch_upper):
                label = 2 # Buy
            elif pd.notna(touch_lower):
                label = 0 # Sell
            # If neither touched, it stays 1 (Hit vertical barrier/horizon)
            
            labels.iloc[t] = label
            
        return labels

class LSTMWithAttention(nn.Module):
    """
    Hybrid LSTM-Attention Network for Time Series Prediction.
    """
    def __init__(self, 
                 input_size: int, 
                 hidden_size: int = 128, 
                 num_layers: int = 2, 
                 dropout: float = 0.2, 
                 num_classes: int = 3):
        super(LSTMWithAttention, self).__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # Bi-directional LSTM
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout,
            bidirectional=True
        )
        
        # Attention Mechanism Layer
        # Projecting bidirectional output (hidden*2) to a score
        self.attention_linear = nn.Linear(hidden_size * 2, 1)
        
        # Final fully connected layers
        self.fc1 = nn.Linear(hidden_size * 2, 64)
        self.dropout = nn.Dropout(dropout)
        self.fc2 = nn.Linear(64, num_classes)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: shape (batch_size, seq_len, input_size)
        """
        # lstm_out: (batch, seq_len, hidden*2)
        lstm_out, _ = self.lstm(x)
        
        # --- Attention Mechanism ---
        # Calculate attention scores for each time step
        # scores: (batch, seq_len, 1)
        scores = self.attention_linear(lstm_out)
        scores = torch.tanh(scores) 
        
        # weights: (batch, seq_len, 1) - Softmax over time dimension
        weights = F.softmax(scores, dim=1)
        
        # Context vector: Weighted sum of LSTM outputs
        # context: (batch, hidden*2)
        # bmm: (batch, 1, seq_len) * (batch, seq_len, hidden*2) -> (batch, 1, hidden*2)
        context = torch.bmm(weights.transpose(1, 2), lstm_out).squeeze(1)
        
        # --- Classification Head ---
        out = self.fc1(context)
        out = F.relu(out)
        out = self.dropout(out)
        out = self.fc2(out)
        
        return out # Logits (CrossEntropy/FocalLoss expects logits)

class FocalLoss(nn.Module):
    """
    Focal Loss for Multi-class Classification to handle class imbalance.
    FL(pt) = -alpha_t * (1 - pt)^gamma * log(pt)
    """
    def __init__(self, 
                 alpha: float = 1.0, 
                 gamma: float = 2.0, 
                 reduction: str = 'mean',
                 ignore_index: int = -100):
        super(FocalLoss, self).__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction
        self.ignore_index = ignore_index

    def forward(self, inputs: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        Args:
            inputs: Logits (batch, num_classes)
            targets: Labels (batch)
        """
        ce_loss = F.cross_entropy(inputs, targets, reduction='none', ignore_index=self.ignore_index)
        pt = torch.exp(-ce_loss)  # probability of the true class
        
        focal_loss = self.alpha * (1 - pt) ** self.gamma * ce_loss

        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        else:
            return focal_loss

# Example Usage Block (for verifying structure)
if __name__ == "__main__":
    # Mock Data
    batch_size = 32
    seq_len = 60
    input_features = 12
    
    # Instantiate Model
    model = LSTMWithAttention(input_size=input_features, hidden_size=64, num_classes=3)
    
    # forward pass
    x = torch.randn(batch_size, seq_len, input_features)
    y_pred = model(x)
    
    print(f"Input shape: {x.shape}")
    print(f"Output shape: {y_pred.shape}") # Should be (32, 3)
    
    # Loss
    criterion = FocalLoss(gamma=2.0)
    y_true = torch.randint(0, 3, (batch_size,))
    loss = criterion(y_pred, y_true)
    print(f"Focal Loss: {loss.item()}")
