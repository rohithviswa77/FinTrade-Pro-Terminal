from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# 1. LOAD THE MASTER BRAIN
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'master_brain_250.keras')
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("AI Master Brain Loaded: Zero-Flicker Mode Active.")
except Exception as e:
    print(f"CRITICAL ERROR: {e}")
    exit()

# 2. LABELS (Institutional DNA)
LABELS = [
    "Head and Shoulders", "Inverse Head and Shoulders", "Double Top", "Double Bottom",
    "Triple Top", "Triple Bottom", "Rounded Top", "Rounded Bottom", "Broadening Top",
    "Broadening Bottom", "Rising Wedge", "Falling Wedge", "Diamond Top", "Diamond Bottom",
    "Island Reversal", "Bump and Run Reversal", "Quasimodo", "V-Top", "V-Bottom",
    "Bull Flag", "Bear Flag", "Bull Pennant", "Bear Pennant", "Ascending Triangle",
    "Descending Triangle", "Symmetrical Triangle", "Rectangle", "Cup and Handle",
    "Inverse Cup and Handle", "Rising Channel", "Falling Channel", "Horizontal Channel",
    "Measured Move", "Three Drives", "Expanding Triangle", "Broadening Wedge",
    "VCP", "Rounded Base Breakout",
    "Gartley", "Bat", "Butterfly", "Crab", "Cypher", "Shark", "ABCD", "5-0 Pattern",
    "Spring", "Upthrust", "Accumulation", "Distribution", "Liquidity Sweep", 
    "Fake Breakout", "Break and Retest", "Support Resistance Flip",
    "Bullish Engulfing", "Bearish Engulfing", "Hammer", "Shooting Star", 
    "Morning Star", "Evening Star", "Doji", "Dragonfly Doji", "Gravestone Doji",
    "Marubozu", "Harami", "Piercing Line", "Dark Cloud Cover", "Morning Doji Star"
]

# --- PERSISTENCE STATE ---
# This keeps the UI stable even if the AI slightly changes its mind
state = {
    "last_pattern": "SCANNING",
    "stability_score": 0,
    "locked_name": "SCANNING"
}

@app.route('/analyze-structure', methods=['POST'])
def analyze():
    global state
    try:
        req_json = request.json
        ohlc = req_json.get('ohlc', [])
        
        if not ohlc:
            return jsonify({"name": "SCANNING", "similarity": 0, "status": "WAITING"})

        # 3. SLIDING WINDOW EXTRACTION
        raw_data = np.array([[c['open'], c['high'], c['low'], c['close'], c.get('v', 0)] for c in ohlc])
        
        if len(raw_data) >= 120:
            data = raw_data[-120:]
        else:
            data = np.pad(raw_data, ((120 - len(raw_data), 0), (0, 0)), mode='edge')
        
        # 4. NORMALIZATION (Crucial for LSTM Stability)
        prices = data[:, :4]
        min_p, max_p = np.min(prices), np.max(prices)
        if max_p == min_p:
            return jsonify({"name": "STALLED", "similarity": 0, "status": "STATIC"})

        norm_prices = (prices - min_p) / (max_p - min_p)
        vols = data[:, 4].reshape(-1, 1)
        max_v = np.max(vols) if np.max(vols) > 0 else 1
        norm_vols = vols / max_v
        
        ai_input = np.hstack((norm_prices, norm_vols)).reshape(1, 120, 5)

        # 5. PREDICTION
        predictions = model.predict(ai_input, verbose=0)
        confidence = float(np.max(predictions))
        winner_idx = np.argmax(predictions)
        detected_pattern = LABELS[winner_idx]

        # 6. STABILITY FILTER (The "Persistence" Gate)
        # If the detected pattern is the same as the last one, increase stability
        if detected_pattern == state["last_pattern"]:
            state["stability_score"] = min(state["stability_score"] + 1, 15)
        else:
            # If it's a new pattern, it must "fight" to overcome the old one
            state["stability_score"] -= 2 
            if state["stability_score"] <= 0:
                state["last_pattern"] = detected_pattern
                state["stability_score"] = 1

        # Only update the "Locked Name" if stability is high OR confidence is extreme (>99.5%)
        if state["stability_score"] >= 5 or confidence > 0.995:
            state["locked_name"] = state["last_pattern"]

        # 7. LOCK LOGIC
        is_locked = (confidence > 0.985 and state["stability_score"] >= 3)
        
        is_bullish = any(x in state["locked_name"].upper() for x in ["BULL", "BOTTOM", "HAMMER", "SPRING", "ASCENDING", "CUP"])
        price_range = max_p - min_p
        target = float(max_p + price_range) if is_bullish else float(min_p - price_range)

        return jsonify({
            "name": state["locked_name"].upper() if is_locked else "SCANNING",
            "similarity": round(confidence * 100, 1),
            "targetPrice": round(target, 2) if is_locked else 0,
            "status": "AI_LOCKED" if is_locked else "ANALYZING",
            "isBullish": is_bullish
        })

    except Exception as e:
        print(f"STABILITY ENGINE ERROR: {e}")
        return jsonify({"error": "Internal Engine Error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)