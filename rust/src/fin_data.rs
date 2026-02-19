use extism_pdk::FromBytesOwned;
use extism_pdk::*;
use rust_decimal::prelude::*;
use serde::{Deserialize, de::DeserializeOwned};
use serde_json::Value;
use std::collections::HashMap;

use crate::Candle;

#[derive(Deserialize)]
pub struct TickersData {
    pub symbol: String,
    pub exchange: String,
    pub candles: Vec<Candle<f64>>,
    pub precision: i32,
}

impl TickersData {
    pub fn get_candles_iter(&self) -> impl Iterator<Item = &Candle<f64>> {
        self.candles.iter()
    }
    pub fn get_candles(&self) -> &Vec<Candle<f64>> {
        &self.candles
    }
    pub fn get_candles_decimal_iter(&self) -> impl Iterator<Item = Candle<Decimal>> {
        let precision = self.precision;
        self.candles
            .iter()
            .map(move |candle| candle.to_decimal(precision))
    }
    pub fn get_candles_decimal(&self) -> Vec<Candle<Decimal>> {
        self.get_candles_decimal_iter().collect()
    }
}

#[derive(Deserialize)]
pub struct FunctionArgs {
    tickers_data: HashMap<String, TickersData>,
    piped_data: HashMap<String, String>,
    call_arguments: HashMap<String, Value>,
}

impl FromBytesOwned for FunctionArgs {
    fn from_bytes_owned(bytes: &[u8]) -> Result<Self, extism_pdk::Error> {
        Ok(serde_json::from_slice(bytes)?)
    }
}

impl FunctionArgs {
    pub fn get_labels(&self) -> Vec<&String> {
        self.tickers_data.keys().collect()
    }

    pub fn get_candles(&self, label: &str) -> Result<&Vec<Candle<f64>>, WithReturnCode<Error>> {
        self.tickers_data
            .get(label)
            .and_then(|v| Some(&v.candles))
            .ok_or(WithReturnCode::new(
                Error::new(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("Symbol {} not found", label),
                )),
                1,
            ))
    }

    pub fn get_candles_iter(
        &self,
        label: &str,
    ) -> Result<impl Iterator<Item = &Candle<f64>>, WithReturnCode<Error>> {
        let candles = self.get_candles(label)?;
        Ok(candles.iter())
    }

    pub fn get_pipe_sources(&self) -> Vec<&String> {
        self.piped_data.keys().collect()
    }

    pub fn get_data_from_pipe(&self, source: &str) -> Result<&String, WithReturnCode<Error>> {
        self.piped_data.get(source).ok_or(WithReturnCode::new(
            Error::new(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("Source {} not found", source),
            )),
            2,
        ))
    }

    pub fn get_ticker(&self, label: &str) -> Result<&TickersData, WithReturnCode<Error>> {
        self.tickers_data.get(label).ok_or(WithReturnCode::new(
            Error::new(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("Ticker {} not found", label),
            )),
            3,
        ))
    }
    /// Returns the candles as Decimal, precision is taken from the ticker
    pub fn get_candles_decimal_iter(
        &self,
        label: &str,
    ) -> Result<impl Iterator<Item = Candle<Decimal>>, WithReturnCode<Error>> {
        let ticker = self.get_ticker(label)?;
        Ok(ticker.get_candles_decimal_iter())
    }
    /// Returns the candles as Decimal, precision is taken from the ticker
    pub fn get_candles_decimal(
        &self,
        label: &str,
    ) -> Result<Vec<Candle<Decimal>>, WithReturnCode<Error>> {
        Ok(self.get_candles_decimal_iter(label)?.collect())
    }

    // Returns the call arguments as a HashMap
    pub fn get_call_arguments(&self) -> &HashMap<String, Value> {
        &self.call_arguments
    }
    pub fn get_call_argument<T: DeserializeOwned>(&self, key: &str) -> Result<T, WithReturnCode<Error>> {
        let arg = self.call_arguments.get(key).ok_or(WithReturnCode::new(
            Error::new(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("Call argument {} not found", key),
            )),
            4,
        ))?;
        let res = serde_json::from_value::<T>(arg.clone()).map_err(|e| {
            WithReturnCode::new(
                Error::new(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("Failed to parse call argument {}: {}", key, e),
                )),
                5,
            )
        });
        match res {
            Ok(value) => Ok(value),
            Err(e) => {
                // Try to parse as string and then convert to the desired type
                if let Some(arg_str) = arg.as_str() {
                    let res_str = serde_json::from_str::<T>(arg_str).map_err(|e| {
                        WithReturnCode::new(
                            Error::new(std::io::Error::new(
                                std::io::ErrorKind::Other,
                                format!("Failed to parse call argument {} as string: {}", key, e),
                            )),
                            6,
                        )
                    });
                    match res_str {
                        Ok(value) => Ok(value),
                        Err(_) => Err(e),
                    }
                } else {
                    Err(e)
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::{Deserialize, Serialize};
    use serde_json::json;

    #[derive(Debug, Deserialize, Serialize, PartialEq)]
    struct CustomStruct {
        name: String,
        value: i32,
    }

    fn create_test_function_args() -> FunctionArgs {
        let mut call_arguments = HashMap::new();
        
        // String value
        call_arguments.insert("string_arg".to_string(), json!("hello world"));
        
        // Integer value
        call_arguments.insert("int_arg".to_string(), json!(42));
        
        // Float value
        call_arguments.insert("float_arg".to_string(), json!(3.14));
        
        // Boolean value
        call_arguments.insert("bool_arg".to_string(), json!(true));
        
        // Object value
        call_arguments.insert("object_arg".to_string(), json!({
            "name": "test",
            "value": 100
        }));
        
        // Array value
        call_arguments.insert("array_arg".to_string(), json!([1, 2, 3, 4, 5]));

        call_arguments.insert("num_str_arg".to_string(), json!("12345"));

        call_arguments.insert("bool_str_arg".to_string(), json!("true"));
        
        call_arguments.insert("bool_str_arg_f".to_string(), json!("false"));

        call_arguments.insert("invalid_num_str_arg".to_string(), json!("not_a_number"));

        call_arguments.insert("array_str_arg".to_string(), json!("[1, 2, 3]"));

        call_arguments.insert("non_existent_arg".to_string(), json!(null));

        call_arguments.insert ("object_str_arg".to_string(), json!(r#"{"name": "test", "value": 100}"#));


        FunctionArgs {
            tickers_data: HashMap::new(),
            piped_data: HashMap::new(),
            call_arguments,
        }
    }

    #[test]
    fn test_get_call_argument_string() {
        let args = create_test_function_args();
        let result: String = args.get_call_argument("string_arg").unwrap();
        assert_eq!(result, "hello world");
    }

    #[test]
    fn test_get_call_argument_int() {
        let args = create_test_function_args();
        let result: i32 = args.get_call_argument("int_arg").unwrap();
        assert_eq!(result, 42);
    }

    #[test]
    fn test_get_call_argument_float() {
        let args = create_test_function_args();
        let result: f64 = args.get_call_argument("float_arg").unwrap();
        assert_eq!(result, 3.14);
    }

    #[test]
    fn test_get_call_argument_bool() {
        let args = create_test_function_args();
        let result: bool = args.get_call_argument("bool_arg").unwrap();
        assert_eq!(result, true);
    }

    #[test]
    fn test_get_call_argument_object() {
        let args = create_test_function_args();
        let result: CustomStruct = args.get_call_argument("object_arg").unwrap();
        assert_eq!(result, CustomStruct {
            name: "test".to_string(),
            value: 100,
        });
    }

    #[test]
    fn test_get_call_argument_array() {
        let args = create_test_function_args();
        let result: Vec<i32> = args.get_call_argument("array_arg").unwrap();
        assert_eq!(result, vec![1, 2, 3, 4, 5]);
    }

    #[test]
    fn test_get_call_argument_num_str() {
        let args = create_test_function_args();
        let result: String = args.get_call_argument("num_str_arg").unwrap();
        assert_eq!(result, "12345");

        let result_int: i32 = args.get_call_argument("num_str_arg").unwrap();
        assert_eq!(result_int, 12345);
    }

    #[test]
    fn test_get_call_argument_bool_str() {
        let args = create_test_function_args();
        let result: String = args.get_call_argument("bool_str_arg").unwrap();
        let result_f: String = args.get_call_argument("bool_str_arg_f").unwrap();
        assert_eq!(result, "true");
        assert_eq!(result_f, "false");

        let result_bool: bool = args.get_call_argument("bool_str_arg").unwrap();
        assert_eq!(result_bool, true);
        let result_bool_f: bool = args.get_call_argument("bool_str_arg_f").unwrap();
        assert_eq!(result_bool_f, false);
    }

    #[test]
    fn test_get_call_argument_invalid_num_str() {
        let args = create_test_function_args();
        let result: Result<i32, WithReturnCode<Error>> = args.get_call_argument
("invalid_num_str_arg");
        assert!(result.is_err());
    }

    #[test]
    fn test_get_call_argument_array_str() {
        let args = create_test_function_args();
        let result: Vec<i32> = args.get_call_argument("array_str_arg").unwrap();
        assert_eq!(result, vec![1, 2, 3]);
    }


    #[test]
    fn test_get_call_argument_not_found() {
        let args = create_test_function_args();
        let result: Result<String, WithReturnCode<Error>> = args.get_call_argument("non_existent_arg");
        assert!(result.is_err());
    }

    #[test]
    fn test_get_object_str_arg() {
        let args = create_test_function_args();
        let result: CustomStruct = args.get_call_argument("object_str_arg").unwrap();
        assert_eq!(result, CustomStruct {
            name: "test".to_string(),
            value: 100,
        });
    }

    #[test]
    fn test_get_call_argument_wrong_type() {
        let args = create_test_function_args();
        let result: Result<i32, WithReturnCode<Error>> = args.get_call_argument("string_arg");
        assert!(result.is_err());   
    }

    #[test]
    fn test_non_existent_argument() {
        let args = create_test_function_args();
        let result: Result<String, WithReturnCode<Error>> = args.get_call_argument("non_existent_arg");
        assert!(result.is_err());
    }
}
