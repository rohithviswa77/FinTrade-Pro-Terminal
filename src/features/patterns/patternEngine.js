export const analyzePattern = (data) => {
  if (data.length < 3) return { type: "Neutral", confidence: 0 };

  const prices = data.map(d => d.value);
  const lastPrice = prices[prices.length - 1];
  const prevPrice = prices[prices.length - 2];

  // Simple Trend Logic
  if (lastPrice > prevPrice * 1.02) {
    return { type: "Bullish Peak", signal: "BUY", color: "text-green-500" };
  } else if (lastPrice < prevPrice * 0.98) {
    return { type: "Bearish Drop", signal: "SELL", color: "text-red-500" };
  }

  return { type: "Consolidating", signal: "WAIT", color: "text-slate-500" };
};