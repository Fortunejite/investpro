'use client';
import { Coin } from '@/types/asset';
import React, { useEffect, useRef, memo } from 'react';
import { getInitialDarkMode } from './ThemeSwitch';
import { formatSymbol } from '@/lib/tradingView';

interface Props {
  coin: Coin;
  exchange: string;
  timeframe: string;
  height?: number;
}

function SimpleTradingChart({ coin, exchange, timeframe, height = 480 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = getInitialDarkMode() ? 'dark' : 'light';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Reset to exact structure TradingView requires
    container.innerHTML = `<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>`;

    const symbol = formatSymbol(coin.symbol.toUpperCase(), exchange);

    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      lineWidth: 2,
      lineType: 0,
      chartType: 'area',
      fontColor: theme === 'dark' ? 'rgba(200,200,200,0.8)' : 'rgba(60,60,60,0.8)',
      gridLineColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      volumeUpColor: 'rgba(34,171,148,0.4)',
      volumeDownColor: 'rgba(247,82,95,0.4)',
      backgroundColor: theme === 'dark' ? '#0d1117' : '#ffffff',
      widgetFontColor: theme === 'dark' ? '#e2e8f0' : '#1e293b',
      upColor: '#22ab94',
      downColor: '#f7525f',
      borderUpColor: '#22ab94',
      borderDownColor: '#f7525f',
      wickUpColor: '#22ab94',
      wickDownColor: '#f7525f',
      colorTheme: theme,
      isTransparent: false,
      locale: 'en',
      chartOnly: false,
      scalePosition: 'right',
      scaleMode: 'Normal',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif',
      fontSize: '13',
      headerFontSize: 'medium',
      valuesTracking: '1',
      changeMode: 'price-and-percent',
      symbols: [[coin.name, `${symbol}|${timeframe}`]],
      dateRanges: ['1d|1', '1m|30', '3m|60', '12m|1D', '60m|1W', 'all|1M'],
      autosize: true,
      width: '100%',
      height: '100%',
      noTimeScale: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
    });

    // Script must be appended AFTER the __widget div, inside the container
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [coin.name, coin.symbol, exchange, timeframe, theme]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full"
      style={{ height, minHeight: height }}
    />
  );
}

export default memo(SimpleTradingChart);
