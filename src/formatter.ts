// formatter.ts — CLI output, colors, progress bar, summary

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";
const WHITE = "\x1b[37m";

export function colorize(text: string, color: string): string {
  return `${color}${text}${RESET}`;
}

export const c = {
  bold: (t: string) => colorize(t, BOLD),
  dim: (t: string) => colorize(t, DIM),
  green: (t: string) => colorize(t, GREEN),
  yellow: (t: string) => colorize(t, YELLOW),
  blue: (t: string) => colorize(t, BLUE),
  magenta: (t: string) => colorize(t, MAGENTA),
  cyan: (t: string) => colorize(t, CYAN),
  red: (t: string) => colorize(t, RED),
  white: (t: string) => colorize(t, WHITE),
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val < 10 ? 2 : 1)} ${units[i]}`;
}

export function printHeader(command: string): void {
  console.log();
  console.log(c.bold(c.cyan(`  imgforge ${command}`)));
  console.log(c.dim("  ─".repeat(20)));
}

export interface FileResult {
  input: string;
  output: string;
  inputSize: number;
  outputSize: number;
  success: boolean;
  error?: string;
}

export function printFileResult(result: FileResult): void {
  const saved = result.inputSize - result.outputSize;
  const pct = result.inputSize > 0 ? (saved / result.inputSize) * 100 : 0;
  const sizeStr = `${formatBytes(result.inputSize)} → ${formatBytes(result.outputSize)}`;

  if (!result.success) {
    console.log(`  ${c.red("✗")} ${result.input} — ${c.red(result.error || "failed")}`);
    return;
  }

  const savingColor = saved > 0 ? c.green : saved < 0 ? c.yellow : c.dim;
  const savingStr = saved > 0
    ? savingColor(`-${pct.toFixed(1)}%`)
    : saved < 0
      ? savingColor(`+${Math.abs(pct).toFixed(1)}%`)
      : savingColor("same");

  console.log(`  ${c.green("✓")} ${c.white(result.input)}`);
  console.log(`    ${c.dim(sizeStr)}  ${savingStr}`);
  console.log(`    ${c.dim("→")} ${c.blue(result.output)}`);
}

export function printProgressBar(current: number, total: number): void {
  const width = 30;
  const filled = Math.round((current / total) * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  const pct = ((current / total) * 100).toFixed(0).padStart(3);
  process.stdout.write(`\r  ${c.cyan(bar)} ${pct}% (${current}/${total})`);
  if (current === total) process.stdout.write("\n");
}

export function printSummary(results: FileResult[]): void {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const totalInput = successful.reduce((s, r) => s + r.inputSize, 0);
  const totalOutput = successful.reduce((s, r) => s + r.outputSize, 0);
  const saved = totalInput - totalOutput;
  const pct = totalInput > 0 ? (saved / totalInput) * 100 : 0;

  console.log();
  console.log(c.bold("  Summary"));
  console.log(c.dim("  ─".repeat(20)));
  console.log(`  Files processed: ${c.green(String(successful.length))}`);
  if (failed.length > 0) {
    console.log(`  Failed:          ${c.red(String(failed.length))}`);
  }
  if (totalInput > 0) {
    console.log(`  Total input:     ${formatBytes(totalInput)}`);
    console.log(`  Total output:    ${formatBytes(totalOutput)}`);
    if (saved > 0) {
      console.log(`  Space saved:     ${c.green(formatBytes(saved))} ${c.green(`(${pct.toFixed(1)}% reduction)`)}`);
    } else if (saved < 0) {
      console.log(`  Size increase:   ${c.yellow(formatBytes(Math.abs(saved)))} ${c.yellow(`(${Math.abs(pct).toFixed(1)}% increase)`)}`);
    }
  }
  console.log();
}

export function printError(msg: string): void {
  console.error(`\n  ${c.red("Error:")} ${msg}\n`);
}

export function printInfo(label: string, value: string): void {
  console.log(`  ${c.dim(label.padEnd(16))} ${value}`);
}
