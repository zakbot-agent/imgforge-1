#!/usr/bin/env node
// index.ts — CLI entry point + argument parsing

import * as path from "path";
import { processImage, ProcessOptions, OutputFormat, isSupportedImage } from "./processor";
import { batchProcess, resolveInputFiles } from "./batch";
import { showInfo } from "./info";
import { addWatermark } from "./watermark";
import {
  printHeader,
  printFileResult,
  printSummary,
  printError,
  printProgressBar,
  FileResult,
  c,
} from "./formatter";

// ── Arg parsing ──────────────────────────────────────────

interface ParsedArgs {
  command: string;
  files: string[];
  width?: number;
  height?: number;
  format?: OutputFormat;
  quality?: number;
  output?: string;
  suffix?: string;
  overwrite: boolean;
  text?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const command = args[0];
  const files: string[] = [];
  let width: number | undefined;
  let height: number | undefined;
  let format: OutputFormat | undefined;
  let quality: number | undefined;
  let output: string | undefined;
  let suffix: string | undefined;
  let overwrite = false;
  let text: string | undefined;

  let i = 1;
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case "--width":
      case "-w":
        width = parseInt(args[++i], 10);
        break;
      case "--height":
      case "-h":
        height = parseInt(args[++i], 10);
        break;
      case "--format":
      case "-f":
        format = args[++i] as OutputFormat;
        break;
      case "--quality":
      case "-q":
        quality = parseInt(args[++i], 10);
        break;
      case "--output":
      case "-o":
        output = args[++i];
        break;
      case "--suffix":
      case "-s":
        suffix = args[++i];
        break;
      case "--overwrite":
        overwrite = true;
        break;
      case "--text":
      case "-t":
        text = args[++i];
        break;
      case "--help":
        printUsage();
        process.exit(0);
        break;
      default:
        if (!arg.startsWith("-")) {
          files.push(arg);
        }
        break;
    }
    i++;
  }

  return { command, files, width, height, format, quality, output, suffix, overwrite, text };
}

function printUsage(): void {
  console.log(`
  ${c.bold(c.cyan("imgforge"))} — Batch image processing CLI

  ${c.bold("Usage:")}
    imgforge <command> <files...> [options]

  ${c.bold("Commands:")}
    resize    <files> --width N [--height N] [--format F]
    convert   <files> --format F
    compress  <files> --quality N
    info      <file>
    batch     <dir> [--width N] [--format F] [--quality N]
    watermark <files> --text "text"

  ${c.bold("Options:")}
    --width, -w N        Target width (px)
    --height, -h N       Target height (px)
    --format, -f F       Output format (png, jpg, webp, avif, gif)
    --quality, -q N      Quality 1-100
    --output, -o DIR     Output directory
    --suffix, -s STR     Filename suffix (default: -imgforge)
    --overwrite          Overwrite original files
    --text, -t TEXT      Watermark text

  ${c.bold("Examples:")}
    imgforge resize photo.png --width 800 --format webp
    imgforge compress *.jpg --quality 75 -o ./compressed
    imgforge batch ./images --width 640 --format webp --quality 80
    imgforge watermark photo.png --text "Copyright 2026"
  `);
}

// ── Command handlers ─────────────────────────────────────

async function handleResize(parsed: ParsedArgs): Promise<void> {
  printHeader("resize");
  const files = resolveInputFiles(parsed.files);
  if (files.length === 0) return printError("No valid image files found.");
  if (!parsed.width && !parsed.height) return printError("Specify --width and/or --height.");

  const opts: ProcessOptions = {
    width: parsed.width,
    height: parsed.height,
    format: parsed.format,
    quality: parsed.quality,
    outputDir: parsed.output,
    suffix: parsed.suffix,
    overwrite: parsed.overwrite,
  };

  const results: FileResult[] = [];
  for (let i = 0; i < files.length; i++) {
    const r = await processImage(files[i], opts);
    results.push(r);
    printFileResult(r);
    if (files.length > 1) printProgressBar(i + 1, files.length);
  }
  printSummary(results);
}

async function handleConvert(parsed: ParsedArgs): Promise<void> {
  printHeader("convert");
  const files = resolveInputFiles(parsed.files);
  if (files.length === 0) return printError("No valid image files found.");
  if (!parsed.format) return printError("Specify --format (png, jpg, webp, avif, gif).");

  const opts: ProcessOptions = {
    format: parsed.format,
    quality: parsed.quality,
    outputDir: parsed.output,
    suffix: parsed.suffix,
    overwrite: parsed.overwrite,
  };

  const results: FileResult[] = [];
  for (let i = 0; i < files.length; i++) {
    const r = await processImage(files[i], opts);
    results.push(r);
    printFileResult(r);
    if (files.length > 1) printProgressBar(i + 1, files.length);
  }
  printSummary(results);
}

async function handleCompress(parsed: ParsedArgs): Promise<void> {
  printHeader("compress");
  const files = resolveInputFiles(parsed.files);
  if (files.length === 0) return printError("No valid image files found.");
  if (!parsed.quality) return printError("Specify --quality (1-100).");

  const opts: ProcessOptions = {
    quality: parsed.quality,
    outputDir: parsed.output,
    suffix: parsed.suffix,
    overwrite: parsed.overwrite,
  };

  const results: FileResult[] = [];
  for (let i = 0; i < files.length; i++) {
    const r = await processImage(files[i], opts);
    results.push(r);
    printFileResult(r);
    if (files.length > 1) printProgressBar(i + 1, files.length);
  }
  printSummary(results);
}

async function handleInfo(parsed: ParsedArgs): Promise<void> {
  if (parsed.files.length === 0) return printError("Specify an image file.");
  for (const f of parsed.files) {
    await showInfo(path.resolve(f));
  }
}

async function handleBatch(parsed: ParsedArgs): Promise<void> {
  printHeader("batch");
  const dir = parsed.files[0];
  if (!dir) return printError("Specify a directory.");

  const opts: ProcessOptions = {
    width: parsed.width,
    height: parsed.height,
    format: parsed.format,
    quality: parsed.quality,
    outputDir: parsed.output,
    suffix: parsed.suffix,
    overwrite: parsed.overwrite,
  };

  const results = await batchProcess(path.resolve(dir), opts);
  if (results.length === 0) return printError("No supported images found in directory.");

  console.log();
  for (const r of results) printFileResult(r);
  printSummary(results);
}

async function handleWatermark(parsed: ParsedArgs): Promise<void> {
  printHeader("watermark");
  const files = resolveInputFiles(parsed.files);
  if (files.length === 0) return printError("No valid image files found.");
  if (!parsed.text) return printError("Specify --text for watermark.");

  const results: FileResult[] = [];
  for (let i = 0; i < files.length; i++) {
    const r = await addWatermark(files[i], {
      text: parsed.text,
      outputDir: parsed.output,
      suffix: parsed.suffix,
      overwrite: parsed.overwrite,
      quality: parsed.quality,
    });
    results.push(r);
    printFileResult(r);
    if (files.length > 1) printProgressBar(i + 1, files.length);
  }
  printSummary(results);
}

// ── Main ─────────────────────────────────────────────────

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);

  switch (parsed.command) {
    case "resize":
      await handleResize(parsed);
      break;
    case "convert":
      await handleConvert(parsed);
      break;
    case "compress":
      await handleCompress(parsed);
      break;
    case "info":
      await handleInfo(parsed);
      break;
    case "batch":
      await handleBatch(parsed);
      break;
    case "watermark":
      await handleWatermark(parsed);
      break;
    default:
      printError(`Unknown command: ${parsed.command}`);
      printUsage();
      process.exit(1);
  }
}

main().catch((err) => {
  printError(err.message);
  process.exit(1);
});
