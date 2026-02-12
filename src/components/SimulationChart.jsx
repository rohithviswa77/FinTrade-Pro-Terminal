import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';

export default function SimulationChart({ data }) {
  const chartContainerRef = useRef();
  const chartRef = useRef(); // Store chart instance to prevent memory leaks

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    // 1. Initialize Chart
    const chart = createChart(chartContainerRef.current, {
      layout: { 
        background: { color: 'transparent' }, 
        textColor: '#d1d2d3' 
      },
      grid: { 
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' }, 
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' } 
      },
      rightPriceScale: { 
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: { 
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 350,
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    // 2. Add Candlestick Series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', 
      downColor: '#ef4444', 
      borderVisible: false,
      wickUpColor: '#22c55e', 
      wickDownColor: '#ef4444',
    });

    // 3. Prepare Data
    // Using a fixed starting point for simulation timestamps
    const chartData = data.map((d, i) => ({
      time: 1672531200 + (i * 1800), 
      open: d.open, 
      high: d.high, 
      low: d.low, 
      close: d.close
    }));

    candlestickSeries.setData(chartData);
    
    // Smoothly fit the content so the pattern is centered
    chart.timeScale().fitContent();

    // 4. Resize Handler
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    // 5. Cleanup on Unmount or Data Change
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data]);

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full h-full min-h-[350px] transition-opacity duration-500" 
    />
  );
}