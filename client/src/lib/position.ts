import { Position } from "@/types/position";

export class PositionUtils {
  
  // Calculate unrealized PnL
  static calculateUnrealizedPnL(
    position: Position, 
    currentPrice: number
  ): { pnl: number; pnlPercentage: number } {
    const entryPrice = parseFloat(position.entryPrice);
    const qty = parseFloat(position.size);
    const side = position.side;

    let pnl = 0;
    if (side === 'long') {
      pnl = (currentPrice - entryPrice) * qty;
    } else {
      pnl = (entryPrice - currentPrice) * qty;
    }

    const margin = parseFloat(position.margin);
    const pnlPercentage = (pnl / margin) * 100;

    return { pnl, pnlPercentage };
  }

  // Calculate liquidation price
  static calculateLiquidationPrice(position: Position): number {
    const entryPrice = parseFloat(position.entryPrice);
    const leverage = position.leverage;
    const side = position.side;
    const maintenanceMarginRate = 0.005; // 0.5%

    if (side === 'long') {
      return entryPrice * (1 - (1 / leverage) + maintenanceMarginRate);
    } else {
      return entryPrice * (1 + (1 / leverage) - maintenanceMarginRate);
    }
  }

  // Calculate margin ratio
  static calculateMarginRatio(position: Position, currentPrice: number): number {
    const { pnl } = this.calculateUnrealizedPnL(position, currentPrice);
    const margin = parseFloat(position.margin);
    const notional = parseFloat(position.notional);
    
    const equity = margin + pnl;
    const marginRatio = equity / notional;
    
    return marginRatio;
  }

  // Format position display data
  static formatPositionForDisplay(position: Position, currentPrice?: number) {
    const liquidationPrice = this.calculateLiquidationPrice(position);
    
    let unrealizedPnl = null;
    let marginRatio = null;
    
    if (currentPrice) {
      const pnlData = this.calculateUnrealizedPnL(position, currentPrice);
      unrealizedPnl = pnlData;
      marginRatio = this.calculateMarginRatio(position, currentPrice);
    }

    return {
      ...position,
      liquidationPrice: liquidationPrice.toFixed(2),
      unrealizedPnl,
      marginRatio: marginRatio ? (marginRatio * 100).toFixed(2) : null,
      isProfit: unrealizedPnl ? unrealizedPnl.pnl >= 0 : null,
    };
  }

  // Check if position is at risk of liquidation
  static isAtRiskOfLiquidation(position: Position, currentPrice: number): boolean {
    const marginRatio = this.calculateMarginRatio(position, currentPrice);
    return marginRatio <= 0.1; // 10% margin ratio threshold
  }
};