// batch.ts — Batch processing with progress

import * as fs from "fs";
import * as path from "path";
import { processImage, ProcessOptions, isSupportedImage } from "./processor";
import { FileResult, printProgressBar } from "./formatter";

export async function batchProcess(dirPath: string, opts: ProcessOptions): Promise<FileResult[]> {
  const files = fs.readdirSync(dirPath)
    .filter((f) => isSupportedImage(f))
    .map((f) => path.join(dirPath, f));

  if (files.length === 0) {
    return [];
  }

  const results: FileResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await processImage(files[i], opts);
    results.push(result);
    printProgressBar(i + 1, files.length);
  }

  return results;
}

export function resolveInputFiles(patterns: string[]): string[] {
  const files: string[] = [];

  for (const p of patterns) {
    if (fs.existsSync(p) && fs.statSync(p).isFile() && isSupportedImage(p)) {
      files.push(path.resolve(p));
    }
  }

  return files;
}
