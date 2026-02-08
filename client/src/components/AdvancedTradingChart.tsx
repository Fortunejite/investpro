"use client";

import { useEffect, useRef, memo } from "react";
import { getInitialDarkMode } from "./ThemeSwitch";
import { convertTimeframe, formatSymbol } from "@/lib/tradingView";

interface RealtimeChartProps {
  asset: string;
  exchange: string;
  timeframe: string;
}

declare global {
  interface Window {
    TradingView: unknown;
  }
}

const AdvancedTradingChart = ({
  asset,
  exchange = "binance",
  timeframe = "1h",
}: RealtimeChartProps) => {
  const container = useRef<HTMLDivElement>(null);
  const theme = getInitialDarkMode() ? "dark" : "light";

  useEffect(() => {
    if (!container.current) return;

    const containerElement = container.current;
    // Clear previous widget
    containerElement.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    script.innerHTML = `
      {
        "allow_symbol_change": false,
        "calendar": false,
        "details": true,
        "hide_side_toolbar": false,
        "hide_top_toolbar": false,
        "hide_legend": false,
        "hide_volume": false,
        "hotlist": false,
        "interval": "${convertTimeframe(timeframe)}",
        "locale": "en",
        "save_image": true,
        "style": "1",
        "symbol": "${formatSymbol(asset, exchange)}",
        "theme": "${theme}",
        "timezone": "Etc/UTC",
        "backgroundColor": "${theme === 'dark' ? '#0F0F0F' : '#ffffff'}",
        "gridColor": "${theme === 'dark' ? 'rgba(242, 242, 242, 0.06)' : 'rgba(0, 0, 0, 0.06)'}",
        "withdateranges": true,
        "compareSymbols": [],
        "autosize": true,
        "enable_publishing": false,
        "range": "3M",
        "height": 500,
        "width": "100%"
      }`;

    if (containerElement) {
      containerElement.appendChild(script);
    }

    return () => {
      containerElement.innerHTML = "";
    };
  }, [asset, exchange, timeframe, theme]);

  return (
    <div className="tradingview-widget-container w-full h-full min-h-125">
      <div 
        ref={container} 
        className="tradingview-widget-container__widget w-full h-full min-h-125"
      />
    </div>
  );
};

export default memo(AdvancedTradingChart);