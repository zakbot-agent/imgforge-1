// processor.ts — Core image processing operations using sharp

import sharp from "sharp";
import * as path from "path";
import * as fs from "fs";
import { FileResult } from "./formatter";

export type OutputFormat = "png" | "jpg" | "jpeg" | "webp" | "avif" | "gif";

export interface ProcessOptions {
  width?: number;
  height?: number;
  format?: OutputFormat;
  quality?: number;
  outputDir?: string;
  suffix?: string;
  overwrite?: boolean;
}

function normalizeFormat(fmt: OutputFormat): "png" | "jpeg" | "webp" | "avif" | "gif" {
  return fmt === "jpg" ? "jpeg" : fmt;
}

function resolveOutputPath(inputPath: string, opts: ProcessOptions): string {
  const dir = opts.outputDir || path.dirname(inputPath);
  const ext = opts.format ? `.${opts.format === "jpeg" ? "jpg" : opts.format}` : path.extname(inputPath);
  const base = path.basename(inputPath, path.extname(inputPath));
  const suffix = opts.suffix ?? (opts.overwrite ? "" : "-imgforge");
  return path.join(dir, `${base}${suffix}${ext}`);
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function applyFormat(pipeline: sharp.Sharp, format: OutputFormat, quality?: number): sharp.Sharp {
  const fmt = normalizeFormat(format);
  const q = quality ?? 80;

  switch (fmt) {
    case "jpeg":
      return pipeline.jpeg({ quality: q });
    case "png":
      return pipeline.png({ quality: q });
    case "webp":
      return pipeline.webp({ quality: q });
    case "avif":
      return pipeline.avif({ quality: q });
    case "gif":
      return pipeline.gif();
    default:
      return pipeline;
  }
}

export async function processImage(inputPath: string, opts: ProcessOptions): Promise<FileResult> {
  const outputPath = resolveOutputPath(inputPath, opts);
  ensureDir(outputPath);

  const inputSize = fs.statSync(inputPath).size;

  try {
    let pipeline = sharp(inputPath);

    // Resize if dimensions specified
    if (opts.width || opts.height) {
      pipeline = pipeline.resize(opts.width || null, opts.height || null, {
        fit: opts.width && opts.height ? "fill" : "inside",
        withoutEnlargement: true,
      });
    }

    // Format conversion / quality
    if (opts.format) {
      pipeline = applyFormat(pipeline, opts.format, opts.quality);
    } else if (opts.quality) {
      // Detect current format and apply quality
      const meta = await sharp(inputPath).metadata();
      const currentFmt = (meta.format || "jpeg") as OutputFormat;
      pipeline = applyFormat(pipeline, currentFmt, opts.quality);
    }

    await pipeline.toFile(outputPath);
    const outputSize = fs.statSync(outputPath).size;

    return { input: inputPath, output: outputPath, inputSize, outputSize, success: true };
  } catch (err: any) {
    return { input: inputPath, output: outputPath, inputSize, outputSize: 0, success: false, error: err.message };
  }
}

export const SUPPORTED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".tiff", ".tif"]);

export function isSupportedImage(filePath: string): boolean {
  return SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}
