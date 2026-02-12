from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import os
import ccxt
import yfinance as yf

app = Flask(__name__)
CORS(app)

# 1. LOAD THE MASTER BRAIN
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'master_brain_250.keras')
model = None

try:
    if os.path.exists(MODEL_PATH):
        # compile=False ensures we load the weights even if the training environment differed
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        print("✅ AI Master Brain: Institutional Structural Model Online.")
    else:
        print(f"❌ CRITICAL: Model file not found at {MODEL_PATH}")
except Exception as e:
    print(f"❌ LOAD ERROR: {e}")

LABELS = ["Head and Shoulders", "Inverse Head and Shoulders", "Double Top", "Double Bottom", "Triple Top", "Triple Bottom", "Rounded Top", "Rounded Bottom", "Broadening Top", "Broadening Bottom", "Rising Wedge", "Falling Wedge", "Diamond Top", "Diamond Bottom", "Island Reversal", "Bump and Run Reversal", "Quasimodo", "V-Top", "V-Bottom", "Bull Flag", "Bear Flag", "Bull Pennant", "Bear Pennant", "Ascending Triangle", "Descending Triangle", "Symmetrical Triangle", "Rectangle", "Cup and Handle", "Inverse Cup and Handle", "Rising Channel", "Falling Channel", "Horizontal Channel", "Measured Move", "Three Drives", "Expanding Triangle", "Broadening Wedge", "VCP", "Rounded Base Breakout", "Gartley", "Bat", "Butterfly", "Crab", "Cypher", "Shark", "ABCD", "5-0 Pattern", "Spring", "Upthrust", "Accumulation", "Distribution", "Liquidity Sweep", "Fake Breakout", "Break and Retest", "Support Resistance Flip", "Bullish Engulfing", "Bearish Engulfing", "Hammer", "Shooting Star", "Morning Star", "Evening Star", "Doji", "Dragonfly Doji", "Gravestone Doji", "Marubozu", "Harami", "Piercing Line", "Dark Cloud Cover", "Morning Doji Star"]

state = {"last_pattern": "SCANNING", "stability_score": 0, "locked_name": "SCANNING"}

def robust_preprocess(ohlc_data):
    """
    Institutional Preprocessing: Standardizes price action 
    to 120-candle Geometric DNA.
    """
    raw_array = np.array([[c['open'], c['high'], c['low'], c['close'], c.get('v', 0)] for c in ohlc_data])
    
    if len(raw_array) < 120:
        raw_array = np.pad(raw_array, ((120 - len(raw_array), 0), (0, 0)), mode='edge')
    else:
        raw_array = raw_array[-120:]

    prices = raw_array[:, :4]
    volumes = raw_array[:, 4]

    # Volatility Check (Filter for dead markets)
    returns = np.diff(prices[:, 3]) / (prices[:-1, 3] + 1e-9)
    volatility = np.std(returns)

    p_min, p_max = np.min(prices), np.max(prices)
    if p_max == p_min: return None, 0
    
    # Normalize price geometry
    norm_prices = (prices - p_min) / (p_max - p_min)
    
    # Log-Normalize volume (better for pattern recognition)
    norm_vols = np.log1p(volumes) / np.log1p(np.max(volumes) if np.max(volumes) > 0 else 1)
    
    combined = np.hstack((norm_prices, norm_vols.reshape(-1, 1)))
    return combined.reshape(1, 120, 5), volatility

@app.route('/analyze-structure', methods=['POST'])
def analyze():
    global state
    if model is None: return jsonify({"error": "AI Brain Offline"}), 500
    
    try:
        req = request.json
        ohlc = req.get('ohlc', [])
        
        processed_input, vol = robust_preprocess(ohlc)
        if processed_input is None or vol < 0.0001: 
            return jsonify({"name": "LOW VOLATILITY", "similarity": 0, "status": "WAITING"})

        preds = model.predict(processed_input, verbose=0)[0]
        confidence = float(np.max(preds))
        winner_idx = np.argmax(preds)
        detected = LABELS[winner_idx]

        # Stability Hysteresis (Prevents flickering)
        if detected == state["last_pattern"]:
            state["stability_score"] = min(state["stability_score"] + 1, 15)
        else:
            state["stability_score"] = 0
            state["last_pattern"] = detected

        # Smart Lock Logic
        is_locked = (confidence > 0.90 and state["stability_score"] >= 2) or (confidence > 0.97)
        
        if is_locked:
            state["locked_name"] = detected
        else:
            state["locked_name"] = "IDENTIFYING..."

        is_bullish = any(x in state["locked_name"].upper() for x in ["BULL", "BOTTOM", "HAMMER", "SPRING", "ASCENDING", "CUP", "FLAG"])
        
        price_data = np.array([c['close'] for c in ohlc])
        current_price = price_data[-1]
        
        # Fibonacci 0.618 Projection for accurate targets
        move_magnitude = (np.max(price_data) - np.min(price_data)) * 0.618 
        target = current_price + move_magnitude if is_bullish else current_price - move_magnitude

        return jsonify({
            "name": state["locked_name"].upper(),
            "similarity": round(confidence * 100, 2),
            "targetPrice": round(float(target), 2),
            "status": "AI_LOCKED" if is_locked else "ANALYZING",
            "isBullish": is_bullish,
            "volatility": round(vol * 100, 4)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/warm-up', methods=['GET'])
def warm_up():
    symbol = request.args.get('symbol', 'BTC/USDT').replace('-', '/')
    timeframe = request.args.get('timeframe', '30m')
    try:
        if "USDT" in symbol.upper():
            exchange = ccxt.binance()
            ohlcv = exchange.fetch_ohlcv(symbol, timeframe=timeframe, limit=120)
            formatted = [{"open": c[1], "high": c[2], "low": c[3], "close": c[4], "v": c[5]} for c in ohlcv]
        else:
            ticker = f"{symbol}.NS" if not symbol.endswith(".NS") else symbol
            stock = yf.Ticker(ticker)
            df = stock.history(interval="30m", period="1mo").tail(120)
            formatted = [{"open": float(row['Open']), "high": float(row['High']), "low": float(row['Low']), "close": float(row['Close']), "v": float(row['Volume'])} for _, row in df.iterrows()]
        return jsonify(formatted)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/index-sentiment', methods=['GET'])
def get_index_sentiment():
    symbol = request.args.get('symbol', '^NSEI')
    try:
        stock = yf.Ticker(symbol)
        df = stock.history(interval="5m", period="1d").tail(5)
        if df.empty: return jsonify({"bullish": 50, "bearish": 50, "price": 0})
        bullish_candles = sum(1 for _, row in df.iterrows() if row['Close'] > row['Open'])
        bullish_percent = (bullish_candles / 5) * 100
        return jsonify({
            "price": float(df['Close'].iloc[-1]),
            "change": float(((df['Close'].iloc[-1] - df['Open'].iloc[0]) / (df['Open'].iloc[0] + 1e-9)) * 100),
            "bullish": bullish_percent,
            "bearish": 100 - bullish_percent
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- FINAL SERVER STARTUP ---
if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 INSTITUTIONAL AI ENGINE (CRYPTO + NSE) ONLINE")
    print("🧠 MODEL: Master Brain 250 (Institutional)")
    print("📍 PORT: 5001")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)