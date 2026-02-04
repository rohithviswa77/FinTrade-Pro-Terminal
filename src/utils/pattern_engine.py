from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from scipy.signal import argrelextrema
from tslearn.metrics import dtw
import random

app = Flask(__name__)
CORS(app)

# 1. INSTITUTIONAL DNA LIBRARY
PATTERNS_DNA = {
    "DOUBLE_BOTTOM": np.array([10, 2, 8, 2, 10]), 
    "DOUBLE_TOP": np.array([2, 10, 4, 10, 2]),
    "HEAD_AND_SHOULDERS_BOTTOM": np.array([5, 3, 5, 1, 5, 3, 5]),
    "HEAD_AND_SHOULDERS_TOP": np.array([5, 8, 5, 10, 5, 8, 5]),
    "TRIPLE_BOTTOM": np.array([10, 2, 8, 2, 8, 2, 10]),
    "TRIPLE_TOP": np.array([2, 10, 4, 10, 4, 10, 2]),
    "BULLISH_FLAG": np.array([1, 10, 8, 9, 7, 8, 6]),
    "BEARISH_FLAG": np.array([10, 1, 3, 2, 4, 3, 5]),
    "CUP_AND_HANDLE": np.array([10, 6, 4, 3, 4, 6, 10, 8, 11]),
    "RECTANGLE_BOX": np.array([10, 2, 10, 2, 10, 2, 10]),
    "ASCENDING_TRIANGLE": np.array([2, 10, 4, 10, 6, 10, 8]),
    "DESCENDING_TRIANGLE": np.array([10, 2, 8, 2, 6, 2, 4]),
    "SYMMETRICAL_TRIANGLE": np.array([10, 2, 8, 3, 7, 4, 6]),
    "FALLING_WEDGE": np.array([10, 2, 8, 3, 7, 4, 5]),
    "RISING_WEDGE": np.array([2, 10, 3, 9, 4, 8, 5]),
    "QUASIMODO_BULLISH": np.array([5, 10, 4, 12, 8, 5]),
    "QUASIMODO_BEARISH": np.array([8, 3, 9, 1, 5, 8]),
    "GARTLEY_BULLISH": np.array([2, 10, 4, 8, 6]),
    "BAT_BULLISH": np.array([2, 10, 3, 9, 5])
}

def check_volume_surge(ohlc):
    """Verifies breakout volume against 20-period average."""
    volumes = [float(c.get('v', 0) or c.get('vol', 0)) for c in ohlc]
    if len(volumes) < 21: return False
    return volumes[-1] >= (np.mean(volumes[-21:-1]) * 1.5)

def analyze_candlesticks(ohlc):
    """Scans for multi-candle institutional signals."""
    c3, c2, c1 = ohlc[-3], ohlc[-2], ohlc[-1]
    
    # 3-CANDLE MORNING STAR
    if (c3['close'] < c3['open'] and 
        abs(c2['close'] - c2['open']) < (abs(c3['close'] - c3['open']) * 0.3) and 
        c1['close'] > c1['open'] and c1['close'] > (c3['open'] + c3['close'])/2):
        return "MORNING STAR"

    body = abs(c1['close'] - c1['open'])
    upper_wick = c1['high'] - max(c1['close'], c1['open'])
    lower_wick = min(c1['close'], c1['open']) - c1['low']
    
    if lower_wick > (body * 2): return "HAMMER / PINBAR"
    if upper_wick > (body * 2): return "SHOOTING STAR"
    if c1['close'] > c2['open'] and c1['open'] < c2['close']: return "BULLISH ENGULFING"
    
    return "NEUTRAL"

def generate_zigzag_path(start_x, start_y, end_x, end_y, steps=10):
    """Mimics real candle volatility in projection."""
    x_vals = np.linspace(start_x, end_x, steps)
    y_vals = np.linspace(start_y, end_y, steps)
    noise = (np.random.rand(steps) - 0.5) * (abs(end_y - start_y) * 0.2)
    noise[0], noise[-1] = 0, 0
    return [{"x": float(x), "y": float(y + n)} for x, y, n in zip(x_vals, y_vals, noise)]

@app.route('/analyze-structure', methods=['POST'])
def analyze():
    data = request.json['ohlc']
    prices = [c['close'] for c in data]
    current_price = prices[-1]
    
    # --- MACRO SKELETON EXTRACTION ---
    skeleton = np.array(prices)[sorted(np.concatenate([
        argrelextrema(np.array(prices), np.greater, order=3)[0],
        argrelextrema(np.array(prices), np.less, order=3)[0],
        [0, len(prices)-1]
    ]))]

    candle_signal = analyze_candlesticks(data)
    volume_confirmed = check_volume_surge(data)
    best_match = {"name": "SCANNING", "similarity": 0}

    for name, template in PATTERNS_DNA.items():
        distance = dtw(skeleton, template)
        similarity = round((1 / (1 + distance)) * 100, 1)
        
        if similarity > best_match['similarity']:
            # Directional & Projection Logic
            is_bullish = any(x in name for x in ["BOTTOM", "BULLISH", "ASCENDING", "CUP", "FALLING_WEDGE"])
            pattern_height = max(skeleton) - min(skeleton)
            neckline = float(max(skeleton)) if is_bullish else float(min(skeleton))
            target_price = neckline + (pattern_height * 0.9) if is_bullish else neckline - (pattern_height * 0.9)
            
            # --- INSTITUTIONAL STATUS LOGIC ---
            crossed = (current_price > neckline) if is_bullish else (current_price < neckline)
            status = "ACTIVE_BREAKOUT" if (crossed and volume_confirmed) else "WEAK_BREAKOUT" if crossed else "WAITING"

            best_match = {
                "name": f"{name.replace('_', ' ')} ({candle_signal})",
                "similarity": similarity,
                "edges": {"neckline": neckline, "support": float(min(skeleton))},
                "projectionPath": generate_zigzag_path(40, current_price, 55, neckline) + 
                                  generate_zigzag_path(55, neckline, 75, target_price)[1:],
                "targetPrice": target_price,
                "status": status,
                "deadlineX": 75 # Anchors the temporal goalpost
            }

    return jsonify(best_match)

if __name__ == '__main__':
    # LIVE SCANNING ACTIVATED - FIXED PORT
    app.run(port=5001, debug=True)