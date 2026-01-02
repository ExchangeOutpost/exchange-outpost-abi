# Exchange Outpost ABI

Cross-platform Application Binary Interface (ABI) library for building [Extism](https://extism.org/) plugins that work with the Exchange Outpost trading platform.

## Overview

Exchange Outpost ABI provides types and utilities for handling financial data, function arguments, and notifications in Extism plugins. Available for both **Rust** and **TypeScript**, this library enables you to build trading strategies and data processing plugins with strong type safety and high-precision decimal arithmetic.

## Features

- 📊 **Candle Types**: Strongly-typed candlestick data structures
- 🔢 **Decimal Support**: High-precision decimal arithmetic (Rust: `rust_decimal`, TypeScript: `decimal.js`)
- 📥 **Function Arguments**: Parse and access ticker data, piped data, and call arguments
- 🔔 **Notifications**: Schedule webhooks and emails from your plugins
- 🛡️ **Type Safety**: Full type safety in both Rust and TypeScript
- 🔌 **Plugin-Ready**: Built for Extism WASM plugins

## Installation

### Rust

Add to your `Cargo.toml`:

```toml
[dependencies]
exchange_outpost_abi = { git = "https://github.com/ExchangeOutpost/exchange-outpost-abi", tag = "0.1.1" }
extism-pdk = "1.4.1"
```

### TypeScript

Add to your `package.json`:

```json
{
  "dependencies": {
    "exchange-outpost-abi": "git+https://github.com/ExchangeOutpost/exchange-outpost-abi.git#0.1.1:typescript",
    "@extism/js-pdk": "^1.1.0"
  }
}
```

Then run:

```bash
npm install
```

## Quick Start

### Rust

```rust
use exchange_outpost_abi::{FunctionArgs, Candle, schedule_email};
use extism_pdk::*;

#[derive(Serialize, ToBytes)]
#[encoding(Json)]
struct Output {
  email_sent: bool
}

#[plugin_fn]
pub fn run(input: String) -> FnResult<Output> {
    // Parse input from host
    let args: FunctionArgs = serde_json::from_str(&input)?;
    
    // Get candles for a ticker
    let candles: Vec<Candle<f64>> = args.get_candles("BTCUSDT")?;
    
    // Work with high-precision decimals
    let decimal_candles: Vec<Candle<Decimal>> = args.get_candles_decimal("BTCUSDT")?
    
    // Access call arguments
    let threshold: f64 = args.get_call_argument("threshold")?;
    
    // Send notifications
    if candles[0].close > threshold {
        schedule_email("trader@example.com", "Price alert triggered!")?;
        Ok (Output { email_sent: true })
    }
    
    Ok(Output{email_sent: false} )
}
```

### TypeScript

```typescript
import { FunctionArgs, scheduleEmail } from 'exchange-outpost-abi';

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
  Host.outputString(JSON.stringify({ status: 'ok' }));
}
```

## Working with Candles

### Rust

```rust
use exchange_outpost_abi::Candle;
use rust_decimal::Decimal;

// Get candles as f64
let candles: Vec<Candle<f64>> = args.get_candles("ETHUSDT")?

// Access candle properties
for candle in &candles {
    println!("Time: {}", candle.timestamp);
    println!("Close: {}", candle.close);
}

// Convert to high-precision decimals
let decimal_candle = candles[0].to_decimal(8); // 8 decimal places
```

### TypeScript

```typescript
import { CandleNumber } from 'exchange-outpost-abi';

// Get candles
const candles = args.getCandles('ETHUSDT');

// Access candle properties
for (const candle of candles) {
  console.log(`Time: ${candle.timestamp}`);
  console.log(`Close: ${candle.close}`);
}

// Convert to high-precision decimals
const decimalCandle = candle.toDecimal(8); // 8 decimal places
```

## Sending Notifications

### Rust

```rust
use exchange_outpost_abi::{schedule_webhook, schedule_email};

// Schedule a webhook
schedule_webhook("https://api.example.com/alert", r#"{"price": 50000}"#)?;

// Schedule an email
schedule_email("trader@example.com", "BTC reached target price!")?;
```

### TypeScript

```typescript
import { scheduleWebhook, scheduleEmail } from 'exchange-outpost-abi';

// Schedule a webhook
scheduleWebhook('https://api.example.com/alert', JSON.stringify({ price: 50000 }));

// Schedule an email
scheduleEmail('trader@example.com', 'BTC reached target price!');
```

## Project Structure

```
exchange-outpost-abi/
├── rust/              # Rust implementation
│   ├── Cargo.toml
│   └── src/
│       ├── candle.rs       # Candle data structures
│       ├── fin_data.rs     # Function arguments parsing
│       ├── notifications.rs # Notification scheduling
│       └── lib.rs          # Library exports
└── typescript/        # TypeScript implementation
    ├── package.json
    └── src/
        ├── candle.ts       # Candle data structures
        ├── fin_data.ts     # Function arguments parsing
        ├── notifications.ts # Notification scheduling
        └── index.ts        # Library exports
```

## Building

### Rust

```bash
cd rust
cargo build --release
```

### TypeScript

```bash
cd typescript
npm install
npm run build
```

## Documentation

For more detailed documentation:

- **TypeScript**: See [typescript/README.md](typescript/README.md)
- **Rust**: Run `cargo doc --open` in the `rust/` directory

## Use Cases

- **Trading Strategies**: Build algorithmic trading strategies with access to candlestick data
- **Technical Indicators**: Calculate custom indicators and signals
- **Data Processing**: Transform and analyze financial data in pipelines
- **Alerts & Notifications**: Monitor market conditions and trigger notifications
- **Multi-Strategy Systems**: Chain multiple plugins together using pipe data

## Version

Current version: **0.1.2**

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please use the [GitHub Issues](https://github.com/ExchangeOutpost/exchange-outpost-abi/issues) page.
