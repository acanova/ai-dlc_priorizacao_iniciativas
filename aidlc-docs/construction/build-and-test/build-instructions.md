# Build Instructions

## Prerequisites

- Build tool: no compilation or bundling step; npm runs native Node.js commands.
- Runtime: Node.js 22 or newer.
- Package manager: npm distributed with Node.js.
- Dependencies: none outside Node.js built-in modules.
- Environment variables: optional `HOST`, `PORT`, and `DATA_FILE`; defaults are suitable for local execution.
- System requirements: local filesystem access and an available loopback port.

## Build and Static Verification

### 1. Confirm the toolchain

```bash
node --version
npm --version
```

The Node.js version must satisfy `>=22` from `package.json`.

### 2. Install dependencies

No installation is required because `package.json` declares no runtime or development dependencies.

### 3. Verify all JavaScript modules

```bash
for source_file in $(find src tests config scripts -type f -name '*.mjs'); do
  node --check "$source_file" || exit 1
done
```

### 4. Verify JSON configuration and initial state

```bash
node -e 'const fs=require("node:fs"); for (const file of ["package.json", "data/initiatives.json"]) JSON.parse(fs.readFileSync(file, "utf8"));'
```

### 5. Start the application

```bash
npm start
```

Expected result: the process listens on `127.0.0.1:3000` and logs `startup.completed`. There is no compiled output directory; the source modules and local configuration are the executable artifacts.

## Troubleshooting

### Unsupported Node.js version

- Cause: `node --version` is older than 22.
- Resolution: install Node.js 22 or newer and repeat the static verification.

### Startup fails before listening

- Cause: invalid `HOST`, `PORT`, or `DATA_FILE`, or malformed/incompatible persisted JSON.
- Resolution: correct the configuration or inspect the configured state file. Existing invalid state is deliberately preserved rather than repaired automatically.

### Port already in use

- Cause: another local process owns port 3000.
- Resolution: choose an available port, for example `PORT=3100 npm start`.

## Extension Compliance

- Resiliency Baseline: N/A; disabled in Requirements Analysis.
- Security Baseline: N/A; disabled in Requirements Analysis.
- Property-Based Testing: N/A; disabled in Requirements Analysis.
