
/**
 * Output data to the host environment.
 * Handles text/JSON data and binary data (ArrayBuffer and typed arrays).
 * 
 * @param data - The data to output. Can be:
 *   - string: output as-is
 *   - ArrayBuffer: output as raw bytes
 *   - ArrayBufferView (typed arrays): output the underlying buffer as bytes
 *   - any other type: stringify to JSON and output as string
 */
export function output(data: any): void {
    if (data instanceof ArrayBuffer) {
        Host.outputBytes(data);
        return;
    }
    if (ArrayBuffer.isView(data)) {
        Host.outputBytes(data.buffer);
        return;
    }
    Host.outputString(typeof data === 'string' ? data : JSON.stringify(data));
}