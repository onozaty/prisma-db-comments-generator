import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/generator.ts"],
  outfile: "dist/generator.cjs",
  platform: "node",
  bundle: true,
  packages: "external",
  format: "cjs",
  sourcemap: true,
});