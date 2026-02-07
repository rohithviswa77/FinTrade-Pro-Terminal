from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf

app = Flask(__name__)
CORS(app)

# 1. LOAD THE PERFECT BRAIN
# This loads your new 100% accuracy model
model = tf.keras.models.load_model('power_brain_50k.h5')

LABELS = ["DOUBLE_BOTTOM", "HEAD_AND_SHOULDERS", "BULLISH_FLAG", "NEUTRAL"]

@app.route('/analyze-structure', methods=['POST'])
def analyze():
    req_json = request.json
    ohlc = req_json['ohlc']
    
    # Extract last 120 candles for adaptive macro analysis
    prices = np.array([c['close'] for c in ohlc[-120:]])
    
    # Padding if we have fewer than 120 candles
    if len(prices) < 120:
        prices = np.pad(prices, (120 - len(prices), 0), 'edge')
    
    # 2. NORMALIZATION
    min_p, max_p = np.min(prices), np.max(prices)
    norm_prices = (prices - min_p) / (max_p - min_p)
    ai_input = norm_prices.reshape(1, 120, 1)

    # 3. THE AI PREDICTION
    predictions = model.predict(ai_input)
    confidence = np.max(predictions)
    winner_idx = np.argmax(predictions)
    pattern_name = LABELS[winner_idx]

    # 4. THE PERFECTION GATE (Hysteresis)
    # Since your model is 100% accurate, we set a very high bar for display
    if confidence < 0.99 or pattern_name == "NEUTRAL":
        return jsonify({"name": "SCANNING", "similarity": round(confidence * 100, 1)})

    # Calculate Institutional Targets
    is_bullish = pattern_name in ["DOUBLE_BOTTOM", "BULLISH_FLAG"]
    target = max_p + (max_p - min_p) if is_bullish else min_p - (max_p - min_p)

    return jsonify({
        "name": pattern_name.replace('_', ' '),
        "similarity": round(confidence * 100, 1),
        "targetPrice": target,
        "status": "AI_LOCKED" # Signal to React that pattern is stable
    })

if __name__ == '__main__':
    app.run(port=5001)