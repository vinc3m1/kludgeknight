/**
 * PIDs of keyboards supported by the official RK web configurator at https://drive.rkgaming.com
 *
 * For these devices, users may prefer the official tool which has full support
 * for macros, media keys, and the newer encoding formats.
 *
 * Extracted from: https://drive.rkgaming.com/assets/index-Crl-yWY5.js
 * Last updated: 2026-02-28
 */

export const RK_WEB_SOFTWARE_URL = 'https://drive.rkgaming.com';

/**
 * Set of PIDs (lowercase hex, no 0x prefix) supported by the official RK web software.
 * Includes USB wire devices only (VID 0x258A).
 */
export const RK_WEB_SOFTWARE_PIDS: ReadonlySet<string> = new Set([
  // rk 84 variants
  '02a6', '02a9', '02aa', '02ab',
  // rk A70, A72
  '020f', '0216',
  // rk M100 variants
  '0211', '023b', '0266', '026b',
  // rk S104 variants
  '025a', '026d',
  // rk f99, k99
  '0218', '0258',
  // rk l75 variants
  '01e5', '0201', '0249', '024a',
  // rk l98
  '01fb',
  // rk m30
  '0136',
  // rk m65 variants
  '01fd', '0202', '022c', '022d', '024b',
  // rk m70 variants
  '01fe', '0203', '0227', '0228', '0245',
  // rk m87 variants
  '01a2', '01d6', '01f5', '0272', '0273', '0274', '0275', '0276',
  // rk n99 variants
  '01b8', '025f',
  // rk r65, r75
  '01f7', '01fc',
  // rk r87 variants
  '019f', '01cb',
  // rk r98pro variants
  '020c', '0210', '0215', '0222', '0225', '027c', '02a0',
  // rk s85 variants
  '0193', '0263', '0264', '0265',
  // rk s98 variants
  '01af', '0223', '0224', '022b', '022f', '0230', '023f', '0240', '0241',
  // rk ultra65
  '0267',
  // rk x87 variants
  '0207', '029a',
]);

/**
 * Check if a keyboard PID is supported by the official RK web software.
 */
export function isRKWebSoftwareSupported(pid: string): boolean {
  return RK_WEB_SOFTWARE_PIDS.has(pid.toLowerCase());
}
