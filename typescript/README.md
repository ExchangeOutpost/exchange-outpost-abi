# Exchange Outpost ABI - TypeScript

TypeScript library for building Extism plugins that work with the Exchange Outpost platform.

## Overview

This library provides types and utilities for handling financial data (candlesticks), function arguments, and notifications in Extism plugins written in TypeScript/JavaScript.

## Features

- **Candle Types**: Strongly-typed candlestick data structures
- **Decimal Support**: High-precision decimal arithmetic using `decimal.js`
- **Function Arguments**: Parse and access ticker data, piped data, and call arguments
- **Notifications**: Schedule webhooks and emails from your plugin
- **Type Safety**: Full TypeScript support with type definitions

## Installation

```bash
npm install
```

## Usage

### Basic Plugin Example

```typescript
import { FunctionArgs, scheduleEmail, output } from 'exchange-outpost-abi';

export function run() {
  // Parse input from host
  const input = Host.inputString();
  const args = FunctionArgs.fromJsonString(input);
  
  // Get candles for a ticker
  const candles = args.getCandles('BTCUSD');
  
  // Work with decimal precision
  const decimalCandles = args.getCandlesDecimal('BTCUSD');
  
  // Access call arguments
  const threshold = args.getCallArgument('threshold', parseFloat);
  
  // Send notifications
  if (candles[0].close > threshold) {
    scheduleEmail('trader@example.com', 'Price alert triggered!');
  }
  
  // Return result
  output({ status: 'ok' });
}
```

### Working with Candles

```typescript
import { CandleNumber } from 'exchange-outpost-abi';

// Candles are automatically parsed from JSON arrays
const candles = args.getCandles('ETH-USD');

// Access candle properties
for (const candle of candles) {
  console.log(`Time: ${candle.timestamp}`);
  console.log(`Open: ${candle.open}`);
  console.log(`High: ${candle.high}`);
  console.log(`Low: ${candle.low}`);
  console.log(`Close: ${candle.close}`);
  console.log(`Volume: ${candle.volume}`);
}

// Convert to high-precision decimals
const decimalCandle = candle.toDecimal(8); // 8 decimal places
```

### Sending Notifications

```typescript
import { scheduleWebhook, scheduleEmail } from 'exchange-outpost-abi';

// Schedule a webhook
scheduleWebhook('/api/alert', JSON.stringify({
  symbol: 'BTCUSD',
  price: 50000,
  action: 'buy'
}));

// Schedule an email
scheduleEmail('alerts@example.com', 'Trading signal detected!');
```

## Building

Compile the TypeScript code to JavaScript:

```bash
npm run build
```

This will generate the compiled files in the `dist/` directory.

## API Reference

### Classes

#### `Candle<T>`
Generic candlestick data structure.

#### `CandleNumber`
Candlestick with number values, extends `Candle<number>`.
- `toDecimal(precision: number): Candle<Decimal>` - Convert to decimal representation

#### `TickersData`
Contains ticker information and candles.
- `getCandles(): CandleNumber[]`
- `getCandlesDecimal(): Candle<Decimal>[]`
- `getCandlesIter()` / `getCandlesDecimalIter()` - Iterator versions

#### `FunctionArgs`
Main container for plugin input data.
- `getLabels(): string[]` - Get all ticker labels
- `getCandles(label: string): CandleNumber[]` - Get candles for a ticker
- `getCandlesDecimal(label: string): Candle<Decimal>[]` - Get decimal candles
- `getTicker(label: string): TickersData` - Get ticker metadata
- `getPipeSources(): string[]` - Get available pipe sources
- `getDataFromPipe(source: string): string` - Get piped data
- `getCallArguments(): Map<string, string>` - Get all call arguments
- `getCallArgument<T>(key: string, parser?: (v: string) => T): T` - Get and parse argument
- `static fromJsonString(json: string): FunctionArgs` - Parse from JSON
- `static empty(): FunctionArgs` - Create an empty FunctionArgs instance

### Functions

#### `output(data: any): void`
Output data to the host environment.
- Handles `ArrayBuffer` and typed arrays as binary output
- Converts strings and objects to appropriate output format
- Automatically stringifies non-string objects to JSON

#### `scheduleWebhook(path: string, body: string): void`
Schedule a webhook notification.

#### `scheduleEmail(email: string, body: string): void`
Schedule an email notification.

### Error Handling

```typescript
import { FunctionError, ErrorCode } from 'exchange-outpost-abi';

try {
  const candles = args.getCandles('INVALID');
} catch (error) {
  if (error instanceof FunctionError) {
    console.log(`Error code: ${error.code}`);
    // Handle specific error codes
  }
}
```

## Error Codes

- `ErrorCode.SymbolNotFound = 1`
- `ErrorCode.SourceNotFound = 2`
- `ErrorCode.TickerNotFound = 3`
- `ErrorCode.CallArgumentNotFound = 4`
- `ErrorCode.CallArgumentParseError = 5`
- `NotificationErrorCode.WebhookError = 6`
- `NotificationErrorCode.EmailError = 7`

## Development

Watch mode for development:

```bash
npm run watch
```

## License
MIT