import Decimal from 'decimal.js';
import { Candle, CandleNumber, parseCandlesFromJson } from './candle';

/**
 * Error codes for FunctionArgs errors
 */
export enum ErrorCode {
  SymbolNotFound = 1,
  SourceNotFound = 2,
  TickerNotFound = 3,
  CallArgumentNotFound = 4,
  CallArgumentParseError = 5,
}

/**
 * Custom error with return code
 */
export class FunctionError extends Error {
  code: ErrorCode;

  constructor(message: string, code: ErrorCode) {
    super(message);
    this.name = 'FunctionError';
    this.code = code;
  }
}

/**
 * Represents ticker data with candles and precision
 */
export class TickersData {
  symbol: string;
  exchange: string;
  candles: CandleNumber[];
  precision: number;

  constructor(symbol: string, exchange: string, candles: CandleNumber[], precision: number) {
    this.symbol = symbol;
    this.exchange = exchange;
    this.candles = candles;
    this.precision = precision;
  }

  /**
   * Get an iterator over the candles
   */
  *getCandlesIter(): IterableIterator<CandleNumber> {
    for (const candle of this.candles) {
      yield candle;
    }
  }

  /**
   * Get the candles array
   */
  getCandles(): CandleNumber[] {
    return this.candles;
  }

  /**
   * Get an iterator over candles converted to Decimal
   */
  *getCandlesDecimalIter(): IterableIterator<Candle<Decimal>> {
    for (const candle of this.candles) {
      yield candle.toDecimal(this.precision);
    }
  }

  /**
   * Get candles as Decimal array
   */
  getCandlesDecimal(): Candle<Decimal>[] {
    return Array.from(this.getCandlesDecimalIter());
  }

  /**
   * Parse TickersData from JSON object
   */
  static fromJson(data: any): TickersData {
    return new TickersData(
      data.symbol,
      data.exchange,
      parseCandlesFromJson(data.candles),
      data.precision
    );
  }
}

/**
 * Main function arguments structure containing all input data
 */
export class FunctionArgs {
  private tickersData: Map<string, TickersData>;
  private pipedData: Map<string, string>;
  private callArguments: Map<string, string>;

  constructor(
    tickersData: Map<string, TickersData>,
    pipedData: Map<string, string>,
    callArguments: Map<string, string>
  ) {
    this.tickersData = tickersData;
    this.pipedData = pipedData;
    this.callArguments = callArguments;
  }

  

  /**
   * Get all ticker labels (keys)
   */
  getLabels(): string[] {
    return Array.from(this.tickersData.keys());
  }

  /**
   * Get candles for a specific label
   */
  getCandles(label: string): CandleNumber[] {
    const ticker = this.tickersData.get(label);
    if (!ticker) {
      throw new FunctionError(`Symbol ${label} not found`, ErrorCode.SymbolNotFound);
    }
    return ticker.candles;
  }

  /**
   * Get candles iterator for a specific label
   */
  *getCandlesIter(label: string): IterableIterator<CandleNumber> {
    const candles = this.getCandles(label);
    for (const candle of candles) {
      yield candle;
    }
  }

  /**
   * Get all pipe source keys
   */
  getPipeSources(): string[] {
    return Array.from(this.pipedData.keys());
  }

  /**
   * Get data from a specific pipe source
   */
  getDataFromPipe(source: string): string {
    const data = this.pipedData.get(source);
    if (data === undefined) {
      throw new FunctionError(`Source ${source} not found`, ErrorCode.SourceNotFound);
    }
    return data;
  }

  /**
   * Get ticker data for a specific label
   */
  getTicker(label: string): TickersData {
    const ticker = this.tickersData.get(label);
    if (!ticker) {
      throw new FunctionError(`Ticker ${label} not found`, ErrorCode.TickerNotFound);
    }
    return ticker;
  }

  /**
   * Get candles as Decimal iterator for a specific label
   * Precision is taken from the ticker
   */
  *getCandlesDecimalIter(label: string): IterableIterator<Candle<Decimal>> {
    const ticker = this.getTicker(label);
    for (const decimalCandle of ticker.getCandlesDecimalIter()) {
      yield decimalCandle;
    }
  }

  /**
   * Get candles as Decimal array for a specific label
   * Precision is taken from the ticker
   */
  getCandlesDecimal(label: string): Candle<Decimal>[] {
    return Array.from(this.getCandlesDecimalIter(label));
  }

  /**
   * Get all call arguments as a Map
   */
  getCallArguments(): Map<string, string> {
    return this.callArguments;
  }

  /**
   * Get a specific call argument and parse it
   */
  getCallArgument<T = string>(key: string, parser?: (value: string) => T): T {
    const arg = this.callArguments.get(key);
    if (arg === undefined) {
      throw new FunctionError(
        `Call argument ${key} not found`,
        ErrorCode.CallArgumentNotFound
      );
    }

    if (!parser) {
      return arg as unknown as T;
    }

    try {
      return parser(arg);
    } catch (error) {
      throw new FunctionError(
        `Call argument ${key} could not be parsed`,
        ErrorCode.CallArgumentParseError
      );
    }
  }

  /**
   * Parse FunctionArgs from JSON object
   */
  static fromJson(data: any): FunctionArgs {
    const tickersData = new Map<string, TickersData>();
    for (const [key, value] of Object.entries(data.tickers_data || {})) {
      tickersData.set(key, TickersData.fromJson(value));
    }

    const pipedData = new Map<string, string>();
    for (const [key, value] of Object.entries(data.piped_data || {})) {
      pipedData.set(key, value as string);
    }

    const callArguments = new Map<string, string>();
    for (const [key, value] of Object.entries(data.call_arguments || {})) {
      callArguments.set(key, value as string);
    }

    return new FunctionArgs(tickersData, pipedData, callArguments);
  }

  /**
   * Parse FunctionArgs from JSON string
   */
  static fromJsonString(jsonString: string): FunctionArgs {
    try {
      const data = JSON.parse(jsonString);
      return FunctionArgs.fromJson(data);
    } catch (error) {
      throw new Error(`Failed to parse FunctionArgs JSON: ${error}`);
    }
  }

  /**
   * Get the function arguments from the host environment
   */
  static get(): FunctionArgs {
    return FunctionArgs.fromJsonString(Host.inputString());
  }
}
