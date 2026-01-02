/**
 * Error codes for notification errors
 */
export enum NotificationErrorCode {
  WebhookError = 6,
  EmailError = 7,
}

/**
 * Custom error for notification failures
 */
export class NotificationError extends Error {
  code: NotificationErrorCode;

  constructor(message: string, code: NotificationErrorCode) {
    super(message);
    this.name = 'NotificationError';
    this.code = code;
  }
}

/**
 * Host function declaration for adding notifications
 */
declare module "extism:host" {
  interface user {
    add_notification(notificationType: I64, notificationTarget: I64, body: I64): void;
  }
}

/**
 * Schedule a webhook notification
 * @param path - The webhook path/URL
 * @param body - The body/payload to send
 */
export function scheduleWebhook(path: string, body: string): void {
  try {
    const { add_notification } = Host.getFunctions();
    const pathMemory = Memory.fromString(path);
    const bodyMemory = Memory.fromString(body);
    const typeMemory = Memory.fromString("webhook");
    
    add_notification(
      typeMemory.offset,
      pathMemory.offset,
      bodyMemory.offset
    );
  } catch (error) {
    throw new NotificationError(
      'Impossible to send webhook notification',
      NotificationErrorCode.WebhookError
    );
  }
}

/**
 * Schedule an email notification
 * @param email - The email address to send to
 * @param body - The email body/content
 */
export function scheduleEmail(email: string, body: string): void {
  try {
    const { add_notification } = Host.getFunctions();
    const emailMemory = Memory.fromString(email);
    const bodyMemory = Memory.fromString(body);
    const typeMemory = Memory.fromString("email");
    
    add_notification(
      typeMemory.offset,
      emailMemory.offset,
      bodyMemory.offset
    );
  } catch (error) {
    throw new NotificationError(
      'Impossible to send email notification',
      NotificationErrorCode.EmailError
    );
  }
}
