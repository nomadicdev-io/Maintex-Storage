Bun.build({
    entrypoints: ['./app/index.ts'],
    outdir: './build',
    target: 'bun', // ensure Bun uses server (Node-like) builtins such as module/createRequire
});