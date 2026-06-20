/**
 * Alignement captures Capsule ↔ VM Paramètres KDE (letterbox playbook VM).
 */
import { PNG } from 'pngjs';

/** Seuil luminance — bandes noires collect-vm-apps-visual. */
export const LUM_THRESHOLD = 12;

export const rowAvg = (png, y) => {
  let sum = 0;
  for (let x = 0; x < png.width; x += 1) {
    const i = (png.width * y + x) * 4;
    sum += png.data[i] + png.data[i + 1] + png.data[i + 2];
  }
  return sum / (png.width * 3);
};

export const colAvg = (png, x, y0, y1) => {
  let sum = 0;
  let n = 0;
  for (let y = y0; y <= y1; y += 1) {
    const i = (png.width * y + x) * 4;
    sum += png.data[i] + png.data[i + 1] + png.data[i + 2];
    n += 1;
  }
  return sum / (n * 3);
};

/** Cadre contenu fenêtre dans une capture VM letterboxée. */
export const detectVmContentFrame = (vmPng) => {
  let top = 0;
  while (top < vmPng.height && rowAvg(vmPng, top) <= LUM_THRESHOLD) top += 1;
  let bottom = vmPng.height - 1;
  while (bottom > top && rowAvg(vmPng, bottom) <= LUM_THRESHOLD) bottom -= 1;
  let left = 0;
  while (left < vmPng.width && colAvg(vmPng, left, top, bottom) <= LUM_THRESHOLD) left += 1;
  let right = vmPng.width - 1;
  while (right > left && colAvg(vmPng, right, top, bottom) <= LUM_THRESHOLD) right -= 1;
  return {
    top,
    left,
    width: right - left + 1,
    height: bottom - top + 1,
  };
};

export const scaleNearest = (src, tw, th) => {
  const out = new PNG({ width: tw, height: th });
  for (let y = 0; y < th; y += 1) {
    for (let x = 0; x < tw; x += 1) {
      const sx = Math.floor((x * src.width) / tw);
      const sy = Math.floor((y * src.height) / th);
      const si = (src.width * sy + sx) << 2;
      const di = (tw * y + x) << 2;
      out.data[di] = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = src.data[si + 3];
    }
  }
  return out;
};

/** Réduit une capture Capsule plein cadre au repère VM (bandes noires). */
export const letterboxCapsuleToVm = (vmPng, capPng) => {
  const frame = detectVmContentFrame(vmPng);
  const out = new PNG({ width: vmPng.width, height: vmPng.height });
  out.data.fill(0);
  for (let i = 3; i < out.data.length; i += 4) out.data[i] = 255;
  const scaled = scaleNearest(capPng, frame.width, frame.height);
  PNG.bitblt(scaled, out, 0, 0, frame.width, frame.height, frame.left, frame.top);
  return out;
};
