import Decimal from 'decimal.js';

/**
 * Represents a single candlestick in financial data, typically used in trading charts.
 */
export class Candle<T> {
  /** The timestamp of the candlestick in milliseconds since the Unix epoch. */
  timestamp: number;
  /** The opening price of the asset during the candlestick's time period. */
  open: T;
  /** The highest price of the asset during the candlestick's time period. */
  high: T;
  /** The lowest price of the asset during the candlestick's time period. */
  low: T;
  /** The closing price of the asset at the end of the candlestick's time period. */
  close: T;
  /** The trading volume of the asset during the candlestick's time period. */
  volume: T;

  constructor(
    timestamp: number,
    open: T,
    high: T,
    low: T,
    close: T,
    volume: T
  ) {
    this.timestamp = timestamp;
    this.open = open;
    this.high = high;
    this.low = low;
    this.close = close;
    this.volume = volume;
  }

  /**
   * Create a Candle from an array representation [timestamp, open, high, low, close, volume]
   */
  static fromArray<T>(arr: [number, T, T, T, T, T]): Candle<T> {
    return new Candle(arr[0], arr[1], arr[2], arr[3], arr[4], arr[5]);
  }
}

/**
 * Candle with number values - provides conversion to Decimal
 */
export class CandleNumber extends Candle<number> {
  /**
   * Convert candle to a Decimal representation
   * @param precision Number of decimal places to round to
   */
  toDecimal(precision: number): Candle<Decimal> {
    return new Candle<Decimal>(
      this.timestamp,
      new Decimal(this.open).toDecimalPlaces(precision),
      new Decimal(this.high).toDecimalPlaces(precision),
      new Decimal(this.low).toDecimalPlaces(precision),
      new Decimal(this.close).toDecimalPlaces(precision),
      new Decimal(this.volume).toDecimalPlaces(precision)
    );
  }

  /**
   * Create a CandleNumber from an array representation
   */
  static fromArrayNumber(arr: [number, number, number, number, number, number]): CandleNumber {
    return new CandleNumber(arr[0], arr[1], arr[2], arr[3], arr[4], arr[5]);
  }
}

/**
 * Parse candles from JSON array format
 */
export function parseCandlesFromJson(data: any[]): CandleNumber[] {
  return data.map(item => {
    if (Array.isArray(item) && item.length === 6) {
      return CandleNumber.fromArrayNumber(item as [number, number, number, number, number, number]);
    }
    throw new Error('Invalid candle format: expected array of 6 elements');
  });
}
