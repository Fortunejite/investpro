'use client';
import { Coin } from '@/types/asset';
import React, { useEffect, useRef, memo } from 'react';
import { getInitialDarkMode } from './ThemeSwitch';
import { formatSymbol } from '@/lib/tradingView';

interface Props {
  coin: Coin;
  exchange: string;
  timeframe: string;
}

function SimpleTradingChart({ coin, exchange, timeframe }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const theme = getInitialDarkMode() ? "dark" : "light";
  
  useEffect(() => {
    if (!container.current) return;

    // Clear previous widget
    const containerElement = container.current;
    containerElement.innerHTML = '';

    const symbol = formatSymbol(coin.symbol.toUpperCase(), exchange);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "lineWidth": 2,
        "lineType": 0,
        "chartType": "area",
        "fontColor": "rgb(106, 109, 120)",
        "gridLineColor": "rgba(242, 242, 242, 0.06)",
        "volumeUpColor": "rgba(34, 171, 148, 0.5)",
        "volumeDownColor": "rgba(247, 82, 95, 0.5)",
        "backgroundColor": "${theme === 'dark' ? '#0F0F0F' : '#FFFFFF'}",
        "widgetFontColor": "${theme === 'dark' ? '#DBDBDB' : '#333333'}",
        "upColor": "#22ab94",
        "downColor": "#f7525f",
        "borderUpColor": "#22ab94",
        "borderDownColor": "#f7525f",
        "wickUpColor": "#22ab94",
        "wickDownColor": "#f7525f",
        "colorTheme": "${theme}",
        "isTransparent": false,
        "locale": "en",
        "chartOnly": false,
        "scalePosition": "right",
        "scaleMode": "Normal",
        "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
        "valuesTracking": "1",
        "changeMode": "price-and-percent",
        "symbols": [
          [
            "${coin.name}",
            "${symbol}|${timeframe}"
          ]
        ],
        "dateRanges": [
          "1d|1",
          "1m|30",
          "3m|60",
          "12m|1D",
          "60m|1W",
          "all|1M"
        ],
        "fontSize": "10",
        "headerFontSize": "medium",
        "autosize": true,
        "width": "100%",
        "height": "100%",
        "noTimeScale": false,
        "hideDateRanges": false,
        "hideMarketStatus": false,
        "hideSymbolLogo": false
      }`;

      containerElement.appendChild(script);

      return () => {
        containerElement.innerHTML = '';
      };
    },
    [coin.name, coin.symbol, exchange, timeframe, theme]
  );

  return (
    <div className="tradingview-widget-container w-full h-full min-h-125" ref={container}>
      <div className="tradingview-widget-container__widget w-full h-full"></div>
    </div>
  );
}

export default memo(SimpleTradingChart);
