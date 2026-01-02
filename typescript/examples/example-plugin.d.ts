declare module "main" {
  // Extism exports take no params and return an I32
  export function analyze(): I32;
  export function analyzeDecimal(): I32;
}

declare module "extism:host" {
  interface user {
    add_notification(notificationType: I64, notificationTarget: I64, body: I64): void;
  }
}
