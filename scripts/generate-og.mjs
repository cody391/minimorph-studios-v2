import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const W = 1200, H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Deep dark background
ctx.fillStyle = '#080812';
ctx.fillRect(0, 0, W, H);

// Subtle grid
ctx.strokeStyle = 'rgba(74,158,255,0.05)';
ctx.lineWidth = 1;
for (let x = 0; x <= W; x += 80) {
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, H);
  ctx.stroke();
}
for (let y = 0; y <= H; y += 80) {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(W, y);
  ctx.stroke();
}

// Central glow
const glow = ctx.createRadialGradient(600, 315, 0, 600, 315, 380);
glow.addColorStop(0, 'rgba(74,158,255,0.12)');
glow.addColorStop(0.5, 'rgba(74,158,255,0.04)');
glow.addColorStop(1, 'rgba(74,158,255,0)');
ctx.fillStyle = glow;
ctx.fillRect(0, 0, W, H);

// Top accent line
const line = ctx.createLinearGradient(300, 0, 900, 0);
line.addColorStop(0, 'rgba(74,158,255,0)');
line.addColorStop(0.5, 'rgba(74,158,255,0.8)');
line.addColorStop(1, 'rgba(74,158,255,0)');
ctx.strokeStyle = line;
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.moveTo(300, 160);
ctx.lineTo(900, 160);
ctx.stroke();

// MiniMorph Studios wordmark
ctx.textAlign = 'center';
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 68px Georgia, serif';
ctx.fillText('MiniMorph Studios', 600, 255);

// Divider dot
ctx.fillStyle = '#4a9eff';
ctx.beginPath();
ctx.arc(600, 290, 3, 0, Math.PI * 2);
ctx.fill();

// Tagline
ctx.font = '28px -apple-system, BlinkMacSystemFont, sans-serif';
ctx.fillStyle = '#4a9eff';
ctx.fillText('Your website, built by AI', 600, 340);

// Sub-tagline
ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
ctx.fillStyle = 'rgba(255,255,255,0.35)';
ctx.fillText('Talk to Elena · She designs your site · Live in 2-3 days', 600, 385);

// Bottom accent line (mirror of top)
ctx.strokeStyle = line;
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.moveTo(300, 430);
ctx.lineTo(900, 430);
ctx.stroke();

// URL
ctx.font = '16px monospace';
ctx.fillStyle = 'rgba(255,255,255,0.2)';
ctx.fillText('minimorphstudios.net', 600, 580);

// Output
const publicDir = path.resolve(__dirname, '../client/public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
const outPath = path.join(publicDir, 'og-image.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outPath, buffer);
console.log('OG image written to:', outPath);
console.log('Size:', Math.round(fs.statSync(outPath).size / 1024) + 'KB');
