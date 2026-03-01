# Missing VK Code Audit Report

Generated from scanning all KB.ini files in `public/rk/Dev/*/KB.ini`
against the VK codes defined in `src/types/keycode.ts` KEY_MAP.

## Summary

| VK Code | Description | Total Keys | Keyboards | Visible |
|---------|-------------|-----------|-----------|---------|
| 0x00 | RK_WWW / Special (flag 0x0b) | 7 | 7 | 7 visible |
| 0x01 | Sequential index (A72-style macro/media encoding) | 139 | 46 | 23 visible, 116 hidden |
| 0x02 | Ctrl+V macro (sequential index) | 7 | 7 | 7 visible |
| 0x03 | Ctrl+A macro (sequential index) | 8 | 8 | 8 visible |
| 0x04 | Ctrl+X macro (sequential index) | 6 | 6 | 6 visible |
| 0x05 | Ctrl+Z macro (sequential index) | 6 | 6 | 6 visible |
| 0x89 | Play/Pause (alt RK encoding) | 8 | 8 | 4 visible, 4 hidden |
| 0x8A | Stop (alt RK encoding) | 7 | 7 | 4 visible, 3 hidden |
| 0x8B | Previous Track (alt RK encoding) | 8 | 8 | 4 visible, 4 hidden |
| 0x8C | Next Track (alt RK encoding) | 8 | 8 | 4 visible, 4 hidden |
| 0x8D | Volume Up (alt RK encoding) | 6 | 6 | 5 visible, 1 hidden |
| 0x8E | Volume Down (alt RK encoding) | 6 | 6 | 5 visible, 1 hidden |
| 0x8F | Mute (alt RK encoding) | 20 | 20 | 5 visible, 15 hidden |
| 0x99 | Calculator | 11 | 11 | 11 visible |
| 0xC1 | Unknown RK macro (likely Undo/Ctrl+Z) | 3 | 3 | 3 visible |
| 0xC3 | Unknown RK special key | 5 | 5 | 5 visible |
| 0xD7 | Unknown RK special key | 5 | 5 | 5 visible |
| 0xE2 | ISO key (Non-US \\ | / ><) | 36 | 36 | 36 visible |
| 0xEB | Unknown RK special key | 5 | 5 | 5 visible |

---

## VK 0x00 — RK_WWW / Special (flag 0x0b)
7 keys across 7 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 01E5 | RK L75 three-mode | [img](public/rk/Dev/01E5/keyimg.png) | K87 | RK_WWW | yes |
| 0201 | RK L75 Keyboard | [img](public/rk/Dev/0201/keyimg.png) | K88 | RK_WWW | yes |
| 0207 | X87 Keyboard | [img](public/rk/Dev/0207/keyimg.png) | K90 | - | yes |
| 020F | RK A70 Keyboard | [img](public/rk/Dev/020F/keyimg.png) | K71 | RK_WWW | yes |
| 0216 | RK A72 Keyboard | [img](public/rk/Dev/0216/keyimg.png) | K77 | - | yes |
| 0249 | RK L75 RU Keyboard | [img](public/rk/Dev/0249/keyimg.png) | K87 | RK_WWW | yes |
| 024A | RK L75 TH Keyboard | [img](public/rk/Dev/024A/keyimg.png) | K87 | RK_WWW | yes |

## VK 0x01 — Sequential index (A72-style macro/media encoding)
139 keys across 46 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 0174 | RK S98RGB | [img](public/rk/Dev/0174/keyimg.png) | K99 | Windows_Mode | hidden |
| 0187 | RK N80 | [img](public/rk/Dev/0187/keyimg.png) | K81 | wheel | hidden |
| 0193 | RK S85 | [img](public/rk/Dev/0193/keyimg.png) | K86 | Wheel | hidden |
| 01A2 | RK M87 | [img](public/rk/Dev/01A2/keyimg.png) | K89 | Home_key | hidden |
| 01AF | RK-S98RGB-New | none | K99 | 2.4G_Mode | hidden |
| 01B8 | RK N99 | [img](public/rk/Dev/01B8/keyimg.png) | K99 | Wheel | hidden |
| 01BF | RK-S98RGB ISO Return Keyboard | [img](public/rk/Dev/01BF/keyimg.png) | K99 | 2.4G_Mode | hidden |
| 01C6 | RK F75 three-mode | [img](public/rk/Dev/01C6/keyimg.png) | K81 | Mute | hidden |
| 01D0 | RK F75 three-mode | none | K81 | Mute | hidden |
| 01D2 | RK F75 Wired | none | K81 | Mute | hidden |
| 01D6 | RK M87 ISO Return Keyboard | [img](public/rk/Dev/01D6/keyimg.png) | K90 | Home_key | hidden |
| 01DE | RK F75 Wired | none | K81 | Mute | hidden |
| 01E5 | RK L75 three-mode | [img](public/rk/Dev/01E5/keyimg.png) | K28 | CTRL_C | yes |
| 01F4 | RK T75 | [img](public/rk/Dev/01F4/keyimg.png) | K83 | - | hidden |
| 01F5 | RK M87 Keyboard | [img](public/rk/Dev/01F5/keyimg.png) | K90 | Home_key | hidden |
| 01FA | RK S85 ISO Return Keyboard | [img](public/rk/Dev/01FA/keyimg.png) | K87 | Wheel | hidden |
| 01FB | RK L98 three-mode | [img](public/rk/Dev/01FB/keyimg.png) | K103 | Wheel | hidden |
| 01FD | M65 | [img](public/rk/Dev/01FD/keyimg.png) | K67 | NextTr | yes |
| 01FE | M70 | [img](public/rk/Dev/01FE/keyimg.png) | K15 | Ctrl+C | yes |
| 0200 | R98Pro Keyboard | [img](public/rk/Dev/0200/keyimg.png) | K99 | Mute | hidden |
| 0201 | RK L75 Keyboard | [img](public/rk/Dev/0201/keyimg.png) | K28 | ;CTRL_C | yes |
| 0202 | RK M65 Keyboard | [img](public/rk/Dev/0202/keyimg.png) | K68 | NextTr | yes |
| 0203 | RK M70 Keyboard | [img](public/rk/Dev/0203/keyimg.png) | K79 | BT_DEV2 | hidden |
| 0207 | X87 Keyboard | [img](public/rk/Dev/0207/keyimg.png) | K87 | - | hidden |
| 020C | R98Pro Keyboard | none | K99 | - | hidden |
| 020F | RK A70 Keyboard | [img](public/rk/Dev/020F/keyimg.png) | K4 | CTRL_C | yes |
| 0210 | R98Pro Keyboard | none | K99 | - | hidden |
| 0211 | RK M100 Keyboard | [img](public/rk/Dev/0211/keyimg.png) | K96 | Mute | hidden |
| 0215 | R98Pro DE Keyboard | [img](public/rk/Dev/0215/keyimg.png) | K100 | Mute | hidden |
| 0216 | RK A72 Keyboard | [img](public/rk/Dev/0216/keyimg.png) | K2 | - | yes |
| 0222 | R98Pro FR Keyboard | [img](public/rk/Dev/0222/keyimg.png) | K100 | Mute | hidden |
| 0223 | RK-S98 TH Keyboard | [img](public/rk/Dev/0223/keyimg.png) | K99 | 2.4G_Mode | hidden |
| 0224 | RK-S98 DE Keyboard | [img](public/rk/Dev/0224/keyimg.png) | K100 | 2.4G_Mode | hidden |
| 0225 | R98Pro Keyboard | [img](public/rk/Dev/0225/keyimg.png) | K103 | Mute | hidden |
| 0227 | RK M70 FR Keyboard | [img](public/rk/Dev/0227/keyimg.png) | K79 | BT_DEV2 | hidden |
| 0228 | RK M70 DE Keyboard | [img](public/rk/Dev/0228/keyimg.png) | K79 | BT_DEV2 | hidden |
| 022B | RK-S98 ES Keyboard | [img](public/rk/Dev/022B/keyimg.png) | K100 | 2.4G_Mode | hidden |
| 022C | RK M65 FR Keyboard | [img](public/rk/Dev/022C/keyimg.png) | K68 | NextTr | yes |
| 022D | RK M65 DE Keyboard | [img](public/rk/Dev/022D/keyimg.png) | K68 | NextTr | yes |
| 022F | RK-S98 Keyboard | [img](public/rk/Dev/022F/keyimg.png) | K103 | 2.4G_Mode | hidden |
| 0230 | RK-S98 RU Keyboard | [img](public/rk/Dev/0230/keyimg.png) | K99 | 2.4G_Mode | hidden |
| 023F | RK-S98 Keyboard | [img](public/rk/Dev/023F/keyimg.png) | K99 | 2.4G_Mode | hidden |
| 0240 | RK-S98 Keyboard | [img](public/rk/Dev/0240/keyimg.png) | K99 | 2.4G_Mode | hidden |
| 0241 | RK-S98 FR Keyboard | [img](public/rk/Dev/0241/keyimg.png) | K100 | 2.4G_Mode | hidden |
| 0249 | RK L75 RU Keyboard | [img](public/rk/Dev/0249/keyimg.png) | K28 | CTRL_C | yes |
| 024A | RK L75 TH Keyboard | [img](public/rk/Dev/024A/keyimg.png) | K28 | CTRL_C | yes |

## VK 0x02 — Ctrl+V macro (sequential index)
7 keys across 7 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 01E5 | RK L75 three-mode | [img](public/rk/Dev/01E5/keyimg.png) | K72 | CTRL_V | yes |
| 01FE | M70 | [img](public/rk/Dev/01FE/keyimg.png) | K59 | Ctrl+V | yes |
| 0201 | RK L75 Keyboard | [img](public/rk/Dev/0201/keyimg.png) | K72 | CTRL_V | yes |
| 020F | RK A70 Keyboard | [img](public/rk/Dev/020F/keyimg.png) | K3 | CTRL_V | yes |
| 0216 | RK A72 Keyboard | [img](public/rk/Dev/0216/keyimg.png) | K3 | - | yes |
| 0249 | RK L75 RU Keyboard | [img](public/rk/Dev/0249/keyimg.png) | K72 | CTRL_V | yes |
| 024A | RK L75 TH Keyboard | [img](public/rk/Dev/024A/keyimg.png) | K72 | CTRL_V | yes |

## VK 0x03 — Ctrl+A macro (sequential index)
8 keys across 8 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 01E5 | RK L75 three-mode | [img](public/rk/Dev/01E5/keyimg.png) | K83 | CTRL_A | yes |
| 01FE | M70 | [img](public/rk/Dev/01FE/keyimg.png) | K70 | Ctrl+A | yes |
| 0201 | RK L75 Keyboard | [img](public/rk/Dev/0201/keyimg.png) | K83 | CTRL_A | yes |
| 0203 | RK M70 Keyboard | [img](public/rk/Dev/0203/keyimg.png) | K70 | Ctrl+A | yes |
| 020F | RK A70 Keyboard | [img](public/rk/Dev/020F/keyimg.png) | K2 | CTRL_A | yes |
| 0216 | RK A72 Keyboard | [img](public/rk/Dev/0216/keyimg.png) | K4 | - | yes |
| 0249 | RK L75 RU Keyboard | [img](public/rk/Dev/0249/keyimg.png) | K83 | CTRL_A | yes |
| 024A | RK L75 TH Keyboard | [img](public/rk/Dev/024A/keyimg.png) | K83 | CTRL_A | yes |

## VK 0x04 — Ctrl+X macro (sequential index)
6 keys across 6 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 01E5 | RK L75 three-mode | [img](public/rk/Dev/01E5/keyimg.png) | K84 | CTRL_X | yes |
| 01FE | M70 | [img](public/rk/Dev/01FE/keyimg.png) | K71 | Ctrl+X | yes |
| 0201 | RK L75 Keyboard | [img](public/rk/Dev/0201/keyimg.png) | K84 | CTRL_X | yes |
| 0216 | RK A72 Keyboard | [img](public/rk/Dev/0216/keyimg.png) | K5 | - | yes |
| 0249 | RK L75 RU Keyboard | [img](public/rk/Dev/0249/keyimg.png) | K84 | CTRL_X | yes |
| 024A | RK L75 TH Keyboard | [img](public/rk/Dev/024A/keyimg.png) | K84 | CTRL_X | yes |

## VK 0x05 — Ctrl+Z macro (sequential index)
6 keys across 6 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 01E5 | RK L75 three-mode | [img](public/rk/Dev/01E5/keyimg.png) | K85 | CTRL_Z | yes |
| 01FE | M70 | [img](public/rk/Dev/01FE/keyimg.png) | K72 | Ctrl+Z | yes |
| 0201 | RK L75 Keyboard | [img](public/rk/Dev/0201/keyimg.png) | K85 | CTRL_Z | yes |
| 0216 | RK A72 Keyboard | [img](public/rk/Dev/0216/keyimg.png) | K6 | - | yes |
| 0249 | RK L75 RU Keyboard | [img](public/rk/Dev/0249/keyimg.png) | K85 | CTRL_Z | yes |
| 024A | RK L75 TH Keyboard | [img](public/rk/Dev/024A/keyimg.png) | K85 | CTRL_Z | yes |

## VK 0x89 — Play/Pause (alt RK encoding)
8 keys across 8 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 00B4 | RK937RGB Wired Keyboaed | [img](public/rk/Dev/00B4/keyimg.png) | K106 | 播放/暂停 | hidden |
| 01A2 | RK M87 | [img](public/rk/Dev/01A2/keyimg.png) | K93 | PlayPause | hidden |
| 01D6 | RK M87 ISO Return Keyboard | [img](public/rk/Dev/01D6/keyimg.png) | K94 | PlayPause | hidden |
| 01F5 | RK M87 Keyboard | [img](public/rk/Dev/01F5/keyimg.png) | K94 | Play/Pause | hidden |
| 01FE | M70 | [img](public/rk/Dev/01FE/keyimg.png) | K75 | PlayPause | yes |
| 0203 | RK M70 Keyboard | [img](public/rk/Dev/0203/keyimg.png) | K76 | PlayPause | yes |
| 0227 | RK M70 FR Keyboard | [img](public/rk/Dev/0227/keyimg.png) | K76 | PlayPause | yes |
| 0228 | RK M70 DE Keyboard | [img](public/rk/Dev/0228/keyimg.png) | K76 | PlayPause | yes |

## VK 0x8A — Stop (alt RK encoding)
7 keys across 7 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 01A2 | RK M87 | [img](public/rk/Dev/01A2/keyimg.png) | K91 | Stop | hidden |
| 01D6 | RK M87 ISO Return Keyboard | [img](public/rk/Dev/01D6/keyimg.png) | K92 | Stop | hidden |
| 01F5 | RK M87 Keyboard | [img](public/rk/Dev/01F5/keyimg.png) | K92 | Stop | hidden |
| 01FE | M70 | [img](public/rk/Dev/01FE/keyimg.png) | K77 | Stop | yes |
| 0203 | RK M70 Keyboard | [img](public/rk/Dev/0203/keyimg.png) | K78 | Stop | yes |
| 0227 | RK M70 FR Keyboard | [img](public/rk/Dev/0227/keyimg.png) | K78 | Stop | yes |
| 0228 | RK M70 DE Keyboard | [img](public/rk/Dev/0228/keyimg.png) | K78 | Stop | yes |

## VK 0x8B — Previous Track (alt RK encoding)
8 keys across 8 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 00B4 | RK937RGB Wired Keyboaed | [img](public/rk/Dev/00B4/keyimg.png) | K105 | 上一曲 | hidden |
| 01A2 | RK M87 | [img](public/rk/Dev/01A2/keyimg.png) | K92 | PrevTr | hidden |
| 01D6 | RK M87 ISO Return Keyboard | [img](public/rk/Dev/01D6/keyimg.png) | K93 | PrevTr | hidden |
| 01F5 | RK M87 Keyboard | [img](public/rk/Dev/01F5/keyimg.png) | K93 | Pre Track | hidden |
| 01FE | M70 | [img](public/rk/Dev/01FE/keyimg.png) | K76 | PrevTr | yes |
| 0203 | RK M70 Keyboard | [img](public/rk/Dev/0203/keyimg.png) | K77 | PrevTr | yes |
| 0227 | RK M70 FR Keyboard | [img](public/rk/Dev/0227/keyimg.png) | K77 | PrevTr | yes |
| 0228 | RK M70 DE Keyboard | [img](public/rk/Dev/0228/keyimg.png) | K77 | PrevTr | yes |

## VK 0x8C — Next Track (alt RK encoding)
8 keys across 8 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 00B4 | RK937RGB Wired Keyboaed | [img](public/rk/Dev/00B4/keyimg.png) | K107 | 下一曲 | hidden |
| 01A2 | RK M87 | [img](public/rk/Dev/01A2/keyimg.png) | K94 | NextTr | hidden |
| 01D6 | RK M87 ISO Return Keyboard | [img](public/rk/Dev/01D6/keyimg.png) | K95 | NextTr | hidden |
| 01F5 | RK M87 Keyboard | [img](public/rk/Dev/01F5/keyimg.png) | K95 | Next Track | hidden |
| 01FE | M70 | [img](public/rk/Dev/01FE/keyimg.png) | K74 | - | yes |
| 0203 | RK M70 Keyboard | [img](public/rk/Dev/0203/keyimg.png) | K75 | - | yes |
| 0227 | RK M70 FR Keyboard | [img](public/rk/Dev/0227/keyimg.png) | K75 | - | yes |
| 0228 | RK M70 DE Keyboard | [img](public/rk/Dev/0228/keyimg.png) | K75 | - | yes |

## VK 0x8D — Volume Up (alt RK encoding)
6 keys across 6 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 00A1 | RK932RGB Keyboard | [img](public/rk/Dev/00A1/keyimg.png) | K105 | vol+ | yes |
| 00A6 | RK932 Keyboard | none | K105 | vol+ | yes |
| 00C5 | RK-S108RGB | [img](public/rk/Dev/00C5/keyimg.png) | K105 | Vol+ | yes |
| 014F | RK932RGB | none | K105 | vol+ | yes |
| 01CB | R87PRO | none | K91 | - | hidden |
| 01FB | RK L98 three-mode | [img](public/rk/Dev/01FB/keyimg.png) | K14 | Vol+ | yes |

## VK 0x8E — Volume Down (alt RK encoding)
6 keys across 6 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 00A1 | RK932RGB Keyboard | [img](public/rk/Dev/00A1/keyimg.png) | K106 | vol- | yes |
| 00A6 | RK932 Keyboard | none | K106 | vol- | yes |
| 00C5 | RK-S108RGB | [img](public/rk/Dev/00C5/keyimg.png) | K106 | Vol- | yes |
| 014F | RK932RGB | none | K106 | vol- | yes |
| 01CB | R87PRO | none | K90 | - | hidden |
| 01FB | RK L98 three-mode | [img](public/rk/Dev/01FB/keyimg.png) | K101 | Vol- | yes |

## VK 0x8F — Mute (alt RK encoding)
20 keys across 20 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 00A1 | RK932RGB Keyboard | [img](public/rk/Dev/00A1/keyimg.png) | K107 | mute | yes |
| 00A6 | RK932 Keyboard | none | K107 | mute | yes |
| 00B4 | RK937RGB Wired Keyboaed | [img](public/rk/Dev/00B4/keyimg.png) | K108 | 静音 | hidden |
| 00C5 | RK-S108RGB | [img](public/rk/Dev/00C5/keyimg.png) | K107 | Mute | yes |
| 014A | RK-R65RGB | none | K67 | Mute | hidden |
| 014F | RK932RGB | none | K107 | mute | yes |
| 0151 | R75RGB | [img](public/rk/Dev/0151/keyimg.png) | K81 | Mute | hidden |
| 015B | RK-R75 | [img](public/rk/Dev/015B/keyimg.png) | K81 | Mute | hidden |
| 015E | R75RGB wired | none | K81 | Mute | hidden |
| 0172 | RK-R65RGB Wired Keyboard | [img](public/rk/Dev/0172/keyimg.png) | K67 | Mute | hidden |
| 017E | RK-R75 ISO Return Keyboard | [img](public/rk/Dev/017E/keyimg.png) | K82 | Mute | hidden |
| 017F | RK-R75RGBSingle mode | none | K81 | Mute | hidden |
| 0184 | RK-R65RGBSingle mode | none | K67 | Mute | hidden |
| 019F | R87PRO | [img](public/rk/Dev/019F/keyimg.png) | K89 | Mute | hidden |
| 01AD | R65RGB ISO Keyboard | [img](public/rk/Dev/01AD/keyimg.png) | K68 | Mute | hidden |
| 01BE | R87PRO | none | K89 | Mute | hidden |
| 01CB | R87PRO | none | K89 | - | hidden |
| 01F7 | RK-R65 Keyboard | [img](public/rk/Dev/01F7/keyimg.png) | K71 | Mute | hidden |
| 01FB | RK L98 three-mode | [img](public/rk/Dev/01FB/keyimg.png) | K102 | Mute | yes |
| 01FC | RK-R75 Keyboard | [img](public/rk/Dev/01FC/keyimg.png) | K82 | Mute | hidden |

## VK 0x99 — Calculator
11 keys across 11 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 00A1 | RK932RGB Keyboard | [img](public/rk/Dev/00A1/keyimg.png) | K108 | cal | yes |
| 00A6 | RK932 Keyboard | none | K108 | cal | yes |
| 00C5 | RK-S108RGB | [img](public/rk/Dev/00C5/keyimg.png) | K108 | Calc | yes |
| 014F | RK932RGB | none | K108 | cal | yes |
| 019F | R87PRO | [img](public/rk/Dev/019F/keyimg.png) | K88 | Cal | yes |
| 01A2 | RK M87 | [img](public/rk/Dev/01A2/keyimg.png) | K28 | Calc | yes |
| 01BE | R87PRO | none | K88 | Cal | yes |
| 01CB | R87PRO | none | K88 | - | yes |
| 01D6 | RK M87 ISO Return Keyboard | [img](public/rk/Dev/01D6/keyimg.png) | K28 | Calc | yes |
| 01F5 | RK M87 Keyboard | [img](public/rk/Dev/01F5/keyimg.png) | K28 | Calc | yes |
| 01FB | RK L98 three-mode | [img](public/rk/Dev/01FB/keyimg.png) | K15 | Calc | yes |

## VK 0xC1 — Unknown RK macro (likely Undo/Ctrl+Z)
3 keys across 3 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 0183 | RK 61 | [img](public/rk/Dev/0183/keyimg.png) | K63 | K56 | yes |
| 01E3 | RK-R87 Wired Keyboard | [img](public/rk/Dev/01E3/keyimg.png) | K89 | K56 | yes |
| 01F5 | RK M87 Keyboard | [img](public/rk/Dev/01F5/keyimg.png) | K89 | K56 | yes |

## VK 0xC3 — Unknown RK special key
5 keys across 5 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 01F5 | RK M87 Keyboard | [img](public/rk/Dev/01F5/keyimg.png) | K96 | K14 | yes |
| 01F7 | RK-R65 Keyboard | [img](public/rk/Dev/01F7/keyimg.png) | K67 | K14 | yes |
| 01FC | RK-R75 Keyboard | [img](public/rk/Dev/01FC/keyimg.png) | K81 | K14 | yes |
| 0225 | R98Pro Keyboard | [img](public/rk/Dev/0225/keyimg.png) | K102 | K14 | yes |
| 022F | RK-S98 Keyboard | [img](public/rk/Dev/022F/keyimg.png) | K102 | K14 | yes |

## VK 0xD7 — Unknown RK special key
5 keys across 5 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 01F5 | RK M87 Keyboard | [img](public/rk/Dev/01F5/keyimg.png) | K98 | K133 | yes |
| 01F7 | RK-R65 Keyboard | [img](public/rk/Dev/01F7/keyimg.png) | K70 | K133 | yes |
| 01FC | RK-R75 Keyboard | [img](public/rk/Dev/01FC/keyimg.png) | K85 | 133 | yes |
| 0225 | R98Pro Keyboard | [img](public/rk/Dev/0225/keyimg.png) | K101 | k133 | yes |
| 022F | RK-S98 Keyboard | [img](public/rk/Dev/022F/keyimg.png) | K101 | K133 | yes |

## VK 0xE2 — ISO key (Non-US \\ | / ><)
36 keys across 36 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 005C | RK-G68RGB-UK Keyboard | none | K69 | >< | yes |
| 0065 | RK61RGB ISO Return Keyboard | [img](public/rk/Dev/0065/keyimg.png) | K62 | >< | yes |
| 0066 | RK61ISO Return Keyboard | [img](public/rk/Dev/0066/keyimg.png) | K62 | >< | yes |
| 0075 | G68RGB ISO Return Keyboard | none | K69 | >< | yes |
| 008C | RK61RGB ISO ReturnWired | none | K62 | >< | yes |
| 009E | RK92RGB N Keyboard | [img](public/rk/Dev/009E/keyimg.png) | K81 | / | yes |
| 00A9 | RK68ISO Return Keyboard | none | K69 | >< | yes |
| 00EC | RK61RGB N ISO Return Keyboard | none | K62 | >< | yes |
| 00F2 | RK87RGB ISO Return Keyboard | [img](public/rk/Dev/00F2/keyimg.png) | K88 | >< | yes |
| 00F4 | RK84 RGB ISO Return Keyboard | [img](public/rk/Dev/00F4/keyimg.png) | K85 | >< | yes |
| 0103 | RK68 N ISO Return Keyboard Bluetooth | [img](public/rk/Dev/0103/keyimg.png) | K69 | >< | yes |
| 0173 | RK98RGB ISO Keyboard | [img](public/rk/Dev/0173/keyimg.png) | K101 | >< | yes |
| 017E | RK-R75 ISO Return Keyboard | [img](public/rk/Dev/017E/keyimg.png) | K81 | >< | yes |
| 0183 | RK 61 | [img](public/rk/Dev/0183/keyimg.png) | K62 | >< | yes |
| 01AB | RK61plus ISO Return Keyboard | [img](public/rk/Dev/01AB/keyimg.png) | K62 | >< | yes |
| 01AD | R65RGB ISO Keyboard | [img](public/rk/Dev/01AD/keyimg.png) | K67 | >< | yes |
| 01BF | RK-S98RGB ISO Return Keyboard | [img](public/rk/Dev/01BF/keyimg.png) | K101 | >< | yes |
| 01C4 | RK96 ISO Return Keyboard | [img](public/rk/Dev/01C4/keyimg.png) | K97 | >< | yes |
| 01C5 | RK-R87 ISO Return Keyboard | [img](public/rk/Dev/01C5/keyimg.png) | K88 | >< | yes |
| 01D6 | RK M87 ISO Return Keyboard | [img](public/rk/Dev/01D6/keyimg.png) | K89 | >< | yes |
| 01D9 | RK-S70 DE Keyboard | [img](public/rk/Dev/01D9/keyimg.png) | K75 | >< | yes |
| 01E3 | RK-R87 Wired Keyboard | [img](public/rk/Dev/01E3/keyimg.png) | K88 | >< | yes |
| 01FA | RK S85 ISO Return Keyboard | [img](public/rk/Dev/01FA/keyimg.png) | K86 | >< | yes |
| 0201 | RK L75 Keyboard | [img](public/rk/Dev/0201/keyimg.png) | K86 | >< | yes |
| 0202 | RK M65 Keyboard | [img](public/rk/Dev/0202/keyimg.png) | K67 | >< | yes |
| 0203 | RK M70 Keyboard | [img](public/rk/Dev/0203/keyimg.png) | K74 | >< | yes |
| 0215 | R98Pro DE Keyboard | [img](public/rk/Dev/0215/keyimg.png) | K99 | >< | yes |
| 0222 | R98Pro FR Keyboard | [img](public/rk/Dev/0222/keyimg.png) | K99 | >< | yes |
| 0224 | RK-S98 DE Keyboard | [img](public/rk/Dev/0224/keyimg.png) | K99 | >< | yes |
| 0227 | RK M70 FR Keyboard | [img](public/rk/Dev/0227/keyimg.png) | K74 | >< | yes |
| 0228 | RK M70 DE Keyboard | [img](public/rk/Dev/0228/keyimg.png) | K74 | >< | yes |
| 0229 | RK-S70 FR Keyboard | [img](public/rk/Dev/0229/keyimg.png) | K75 | >< | yes |
| 022B | RK-S98 ES Keyboard | [img](public/rk/Dev/022B/keyimg.png) | K99 | >< | yes |
| 022C | RK M65 FR Keyboard | [img](public/rk/Dev/022C/keyimg.png) | K67 | >< | yes |
| 022D | RK M65 DE Keyboard | [img](public/rk/Dev/022D/keyimg.png) | K67 | >< | yes |
| 0241 | RK-S98 FR Keyboard | [img](public/rk/Dev/0241/keyimg.png) | K99 | >< | yes |

## VK 0xEB — Unknown RK special key
5 keys across 5 keyboards

| PID | Keyboard Name | Image | Key | Comment | Visible |
|-----|--------------|-------|-----|---------|---------|
| 01F5 | RK M87 Keyboard | [img](public/rk/Dev/01F5/keyimg.png) | K99 | K131 | yes |
| 01F7 | RK-R65 Keyboard | [img](public/rk/Dev/01F7/keyimg.png) | K68 | K131 | yes |
| 01FC | RK-R75 Keyboard | [img](public/rk/Dev/01FC/keyimg.png) | K83 | K131 | yes |
| 0225 | R98Pro Keyboard | [img](public/rk/Dev/0225/keyimg.png) | K99 | k131 | yes |
| 022F | RK-S98 Keyboard | [img](public/rk/Dev/022F/keyimg.png) | K99 | K131 | yes |
