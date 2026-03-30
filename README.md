# imgforge

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)

> Batch image processing CLI — resize, compress, convert, watermark

## Features

- CLI tool
- TypeScript support

## Tech Stack

**Runtime:**
- TypeScript v5.9.3

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn

## Installation

```bash
cd imgforge
npm install
```

Or install globally:

```bash
npm install -g imgforge
```

## Usage

### CLI

```bash
imgforge
```

### Available Scripts

| Script | Command |
|--------|---------|
| `npm run build` | `tsc` |
| `npm run start` | `node dist/index.js` |

## Project Structure

```
├── src
│   ├── batch.ts
│   ├── formatter.ts
│   ├── index.ts
│   ├── info.ts
│   ├── processor.ts
│   └── watermark.ts
├── package.json
└── tsconfig.json
```

## License

This project is licensed under the **MIT** license.

## Author

**Zakaria Kone**

---
> Maintained by [zakbot-agent](https://github.com/zakbot-agent) & [ZakariaDev000](https://github.com/ZakariaDev000)
