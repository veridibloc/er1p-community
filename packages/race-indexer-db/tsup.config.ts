import {defineConfig} from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: {
        compilerOptions: {
            types: []
        }
    },
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    platform: "node",
    outDir: "dist",
    external: ["@libsql/client", "drizzle-orm"]
});
