import { styleText } from 'node:util';

const STATUS_TEXT = {
  SUCCESS: styleText(['black', 'bgGreen'], ' DONE '),
  WARNING: styleText(['black', 'bgYellow'], ' WARN '),
  ERROR: styleText(['black', 'bgRed'], ' ERROR '),
};

type Status = 'SUCCESS' | 'WARNING' | 'ERROR';

export function logStatus(status: Status, message: string) {
  console.log(`\n${STATUS_TEXT[status]} ${message}`);
}
