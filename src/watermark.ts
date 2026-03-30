// watermark.ts — Text watermark overlay using sharp

import sharp from "sharp";
import * as path from "path";
import * as fs from "fs";
import { FileResult } from "./formatter";

export interface WatermarkOptions {
  text: string;
  outputDir?: string;
  suffix?: string;
  overwrite?: boolean;
  quality?: number;
  format?: string;
}

export async function addWatermark(inputPath: string, opts: WatermarkOptions): Promise<FileResult> {
  const ext = path.extname(inputPath);
  const base = path.basename(inputPath, ext);
  const dir = opts.outputDir || path.dirname(inputPath);
  const suffix = opts.suffix ?? (opts.overwrite ? "" : "-watermarked");
  const outExt = opts.format ? `.${opts.format === "jpeg" ? "jpg" : opts.format}` : ext;
  const outputPath = path.join(dir, `${base}${suffix}${outExt}`);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const inputSize = fs.statSync(inputPath).size;

  try {
    const meta = await sharp(inputPath).metadata();
    const width = meta.width || 800;
    const height = meta.height || 600;

    // Scale font size relative to image
    const fontSize = Math.max(16, Math.floor(width / 25));
    const escapedText = opts.text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const svgOverlay = Buffer.from(`
      <svg width="${width}" height="${height}">
        <style>
          .watermark {
            fill: rgba(255, 255, 255, 0.5);
            font-size: ${fontSize}px;
            font-family: sans-serif;
            font-weight: bold;
          }
        </style>
        <text x="${width - 20}" y="${height - 20}" text-anchor="end" class="watermark">${escapedText}</text>
      </svg>
    `);

    let pipeline = sharp(inputPath).composite([{ input: svgOverlay, top: 0, left: 0 }]);

    // Apply format/quality if specified
    const q = opts.quality ?? 90;
    const fmt = opts.format || meta.format || "jpeg";
    switch (fmt) {
      case "jpeg": case "jpg": pipeline = pipeline.jpeg({ quality: q }); break;
      case "png": pipeline = pipeline.png({ quality: q }); break;
      case "webp": pipeline = pipeline.webp({ quality: q }); break;
      case "avif": pipeline = pipeline.avif({ quality: q }); break;
      default: pipeline = pipeline.jpeg({ quality: q });
    }

    await pipeline.toFile(outputPath);
    const outputSize = fs.statSync(outputPath).size;

    return { input: inputPath, output: outputPath, inputSize, outputSize, success: true };
  } catch (err: any) {
    return { input: inputPath, output: outputPath, inputSize, outputSize: 0, success: false, error: err.message };
  }
}
