import {defineConfig} from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: {
        compilerOptions: {
            types: [],
            lib: ["ES2022", "DOM"]
        }
    },
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    outDir: "dist",
    platform: "neutral",
    // Don't bundle dependencies - let the consumer bundle them
    external: [
        /^@signumjs\//,  // Exclude all @signumjs/* packages (using regex)
    ],
});
