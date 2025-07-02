#!/usr/bin/env node

// Simple HEX to OKLCH converter
// Usage: node color-to-oklch.js #099af2

const color = process.argv[2];

if (!color) {
    console.log('Usage: node color-to-oklch.js <color>');
    console.log('Example: node color-to-oklch.js #099af2');
    process.exit(1);
}

// Convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
                r: Number.parseInt(result[1], 16) / 255,
                g: Number.parseInt(result[2], 16) / 255,
                b: Number.parseInt(result[3], 16) / 255,
            }
        : null;
}

// Convert linear RGB to XYZ
function linearRgbToXyz(r, g, b) {
    const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
    const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
    const z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;
    return { x, y, z };
}

// Convert XYZ to OKLab
function xyzToOklab(x, y, z) {
    const l = 0.8189330 * x + 0.3618667 * y - 0.1288597 * z;
    const m = 0.0329845 * x + 0.9293119 * y + 0.0361456 * z;
    const s = 0.0482003 * x + 0.2643662 * y + 0.6338517 * z;

    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);

    return {
        L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
        a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
        b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
    };
}

// Convert OKLab to OKLCH
function oklabToOklch(L, a, b) {
    const C = Math.sqrt(a * a + b * b);
    let h = Math.atan2(b, a) * 180 / Math.PI;
    if (h < 0)
        h += 360;
    return { L, C, h };
}

// sRGB to linear RGB
function srgbToLinear(c) {
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// Main conversion
const rgb = hexToRgb(color);
if (!rgb) {
    console.error('Invalid color format');
    process.exit(1);
}

// Convert to linear RGB
const linearR = srgbToLinear(rgb.r);
const linearG = srgbToLinear(rgb.g);
const linearB = srgbToLinear(rgb.b);

// Convert to XYZ
const xyz = linearRgbToXyz(linearR, linearG, linearB);

// Convert to OKLab
const oklab = xyzToOklab(xyz.x, xyz.y, xyz.z);

// Convert to OKLCH
const oklch = oklabToOklch(oklab.L, oklab.a, oklab.b);

// Format output
console.log(`Input: ${color}`);
console.log(`OKLCH: oklch(${oklch.L.toFixed(3)} ${oklch.C.toFixed(3)} ${oklch.h.toFixed(1)})`);
console.log(`CSS: oklch(${(oklch.L * 100).toFixed(1)}% ${oklch.C.toFixed(3)} ${oklch.h.toFixed(1)})`);
