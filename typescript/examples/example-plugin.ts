/**
 * Example Extism plugin demonstrating the usage of exchange-outpost-abi
 * 
 * This plugin implements a simple moving average crossover strategy
 */

import { FunctionArgs, scheduleEmail, FunctionError } from '../src/index';

/**
 * Calculate simple moving average
 */
function calculateSMA(values: number[], period: number): number {
  if (values.length < period) {
    throw new Error('Not enough data for SMA calculation');
  }
  
  const slice = values.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
}

/**
 * Main plugin export - analyzes ticker data and sends alerts
 */
export function run() {
  try {
    // Get input from host
    const input = Host.inputString();
    const args = FunctionArgs.fromJsonString(input);
    
    // Get configuration from call arguments
    const symbol = args.getCallArgument('symbol');
    const shortPeriod = args.getCallArgument('short_period', parseInt);
    const longPeriod = args.getCallArgument('long_period', parseInt);
    const email = args.getCallArgument('email');
    
    // Get candles for the symbol
    const candles = args.getCandles(symbol);
    
    if (candles.length < longPeriod) {
      throw new Error(`Not enough candles. Need ${longPeriod}, have ${candles.length}`);
    }
    
    // Extract closing prices
    const closePrices = candles.map(c => c.close);
    
    // Calculate moving averages
    const shortMA = calculateSMA(closePrices, shortPeriod);
    const longMA = calculateSMA(closePrices, longPeriod);
    
    // Determine signal
    let signal = 'HOLD';
    if (shortMA > longMA) {
      signal = 'BUY';
    } else if (shortMA < longMA) {
      signal = 'SELL';
    }
    
    // Get latest candle info
    const latestCandle = candles[candles.length - 1];
    
    // Prepare response
    const result = {
      symbol,
      timestamp: latestCandle.timestamp,
      price: latestCandle.close,
      shortMA: shortMA.toFixed(2),
      longMA: longMA.toFixed(2),
      signal,
    };
    
    // Send email notification if signal is not HOLD
    if (signal !== 'HOLD') {
      const emailBody = `
Trading Signal for ${symbol}

Signal: ${signal}
Current Price: ${latestCandle.close}
Short MA (${shortPeriod}): ${shortMA.toFixed(2)}
Long MA (${longPeriod}): ${longMA.toFixed(2)}
Time: ${new Date(latestCandle.timestamp * 1000).toISOString()}
      `.trim();
      
      scheduleEmail(email, emailBody);
      result['notification'] = 'Email scheduled';
    }
    
    // Return result as JSON
    Host.outputString(JSON.stringify(result, null, 2));
    
  } catch (error) {
    if (error instanceof FunctionError) {
      Host.outputString(JSON.stringify({
        error: error.message,
        code: error.code
      }));
    } else {
      Host.outputString(JSON.stringify({
        error: error.message || 'Unknown error'
      }));
    }
  }
}