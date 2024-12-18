export async function getUniqueColor(text: string) {
  const e = new TextEncoder().encode(text)
  const d = await crypto.subtle.digest({ name: "SHA-1"}, e)
  const n = new Uint16Array(d)
  
  const h = n[0] % 360                // Hue: 0-360
  const s = (n[1] % 50) / 100 + 0.5   // Saturation: 50%-100%
  const l = (n[2] % 40) / 100 + 0.3   // Lightness: 30%-70%

  const { r, g, b } = hslToRgb(h, s, l)
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r: number, g: number, b: number;

  if (s === 0) {
    // Achromatic color (gray scale)
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q: number = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p: number = 2 * l - q;
    const hNormalized: number = h / 360;

    r = hue2rgb(p, q, hNormalized + 1 / 3);
    g = hue2rgb(p, q, hNormalized);
    b = hue2rgb(p, q, hNormalized - 1 / 3);
  }

  return { r: r * 255, g: g * 255, b: b * 255 };
}
