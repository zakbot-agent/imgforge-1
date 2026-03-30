// info.ts — Image metadata reader

import sharp from "sharp";
import * as fs from "fs";
import { c, formatBytes, printHeader, printInfo } from "./formatter";

export async function showInfo(filePath: string): Promise<void> {
  printHeader("info");

  const stat = fs.statSync(filePath);
  const meta = await sharp(filePath).metadata();

  printInfo("File", filePath);
  printInfo("Format", c.cyan(meta.format || "unknown"));
  printInfo("Dimensions", `${c.white(String(meta.width))} x ${c.white(String(meta.height))} px`);
  printInfo("Size", c.yellow(formatBytes(stat.size)));
  printInfo("Color space", meta.space || "unknown");
  printInfo("Channels", String(meta.channels || "unknown"));
  printInfo("Bit depth", meta.depth || "unknown");
  if (meta.density) printInfo("DPI", String(meta.density));
  if (meta.hasAlpha !== undefined) printInfo("Alpha", meta.hasAlpha ? "yes" : "no");
  if (meta.orientation) printInfo("Orientation", String(meta.orientation));
  console.log();
}
