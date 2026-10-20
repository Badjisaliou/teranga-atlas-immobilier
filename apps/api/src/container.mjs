// Validate configuration, volume and initial setup before accepting connections.
await import('./preflight.mjs');
if(process.exitCode)process.exit(process.exitCode);
await import('./start.mjs');
