import React, { useEffect, useRef } from 'react';
import { createChart, AreaSeries } from 'lightweight-charts';

export default function MiniChart({ symbol, color = '#3b82f6' }) {
  const chartContainerRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initialize Chart with a clean, transparent layout for the dashboard list
    const chart = createChart(chartContainerRef.current, {
      width: 140,
      height: 60,
      layout: { 
        background: { color: 'transparent' },
        textColor: 'transparent' 
      },
      grid: { 
        vertLines: { visible: false }, 
        horzLines: { visible: false } 
      },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      handleScroll: false,
      handleScale: false,
    });

    // v5.1.0 Series API: Adding the Area (Sparkline) series
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: color,
      topColor: `${color}33`, // Semi-transparent top
      bottomColor: 'transparent',
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    const fetchData = async () => {
      try {
        // Fetching 24 hours of data at 1-hour intervals for the sparkline
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=24`
        );
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        const formattedData = data.map(d => ({
          time: d[0] / 1000,
          value: parseFloat(d[4]), // Use the 'Close' price for the trend
        })).sort((a, b) => a.time - b.time);

        areaSeries.setData(formattedData);
        chart.timeScale().fitContent();
      } catch (err) {
        // Silencing console errors for cleaner debugging of the global feed
        console.warn(`Feed not found for ${symbol}: Check if symbol is valid on Binance`);
      }
    };

    fetchData();

    // Cleanup to prevent memory leaks and chart duplication
    return () => chart.remove();
  }, [symbol, color]);

  return (
    <div 
      ref={chartContainerRef} 
      className="pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity" 
      style={{ width: '140px', height: '60px' }} 
    />
  );
}