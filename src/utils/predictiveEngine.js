import { patternChain, allPatterns } from "candlestick";

/**
 * Geometric Structural Engine: Focused on 30-40m Pattern Recognition.
 * Scans for structural "edges" and pivot similarity rather than future prediction.
 */
export const getMarketPrediction = (ohlcData) => {
  // Sensitive 40-minute window for pattern formation
  if (!ohlcData || ohlcData.length < 40) {
    return { name: "SCANNING...", signal: "WAIT", similarity: 0 };
  }

  const recent = ohlcData.slice(-40);
  const prices = recent.map(c => c.close);
  const currentPrice = prices[prices.length - 1];

  // --- 1. PIVOT SCANNING (ZIG-ZAG LOGIC) ---
  const macroHigh = Math.max(...prices);
  const macroLow = Math.min(...prices);
  const highIndex = prices.indexOf(macroHigh);
  const lowIndex = prices.indexOf(macroLow);

  // --- 2. STRUCTURAL MATCHING (DNA TEMPLATES) ---
  
  // A. DOUBLE BOTTOM (W-SHAPE) DETECTION
  const firstHalf = prices.slice(0, 20);
  const firstBottom = Math.min(...firstHalf);
  const neckline = Math.max(...prices.slice(prices.indexOf(firstBottom), -5));
  
  // Accuracy check: Is current price returning to the First Bottom edge?
  const bottomDiff = Math.abs(currentPrice - firstBottom);
  const dbSimilarity = (1 - (bottomDiff / firstBottom)) * 100;

  if (dbSimilarity > 97 && prices.indexOf(firstBottom) < prices.indexOf(neckline)) {
    return {
      name: "DOUBLE BOTTOM",
      type: "BULLISH REVERSAL",
      similarity: dbSimilarity.toFixed(1),
      edges: { support: firstBottom, neckline: neckline },
      status: currentPrice > neckline ? "BREAKOUT" : "FORMING SECOND BOTTOM",
      color: "text-green-500",
      signal: "PURCHASE",
      // Visualization path: First Bottom -> Neckline -> Second Bottom
      visualSkeleton: [firstBottom, neckline, firstBottom, currentPrice] 
    };
  }

  // B. DOUBLE TOP (M-SHAPE) DETECTION
  const firstTop = Math.max(...firstHalf);
  const dtNeckline = Math.min(...prices.slice(prices.indexOf(firstTop), -5));
  const topDiff = Math.abs(currentPrice - firstTop);
  const dtSimilarity = (1 - (topDiff / firstTop)) * 100;

  if (dtSimilarity > 97 && prices.indexOf(firstTop) < prices.indexOf(dtNeckline)) {
    return {
      name: "DOUBLE TOP",
      type: "BEARISH REVERSAL",
      similarity: dtSimilarity.toFixed(1),
      edges: { resistance: firstTop, neckline: dtNeckline },
      status: currentPrice < dtNeckline ? "BREAKDOWN" : "FORMING SECOND TOP",
      color: "text-red-500",
      signal: "SELL",
      visualSkeleton: [firstTop, dtNeckline, firstTop, currentPrice]
    };
  }

  // --- 3. FALLBACK: CANDLESTICK RECOGNITION (MICRO-EDGES) ---
  const detections = patternChain(recent, allPatterns);
  if (detections.length > 0) {
    const pattern = detections[detections.length - 1].pattern;
    return {
      name: pattern.replace(/([A-Z])/g, ' $1').toUpperCase(),
      type: "CANDLESTICK EDGE",
      similarity: 100,
      color: "text-blue-400",
      signal: "HOLD"
    };
  }

  return { name: "STABLE STRUCTURE", similarity: 0, signal: "WAIT", color: "text-slate-500" };
};