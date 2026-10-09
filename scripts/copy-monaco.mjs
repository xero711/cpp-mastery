import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("node_modules/monaco-editor/min/vs");
const destination = resolve("public/monaco/vs");
await mkdir(resolve("public/monaco"), { recursive: true });
await cp(source, destination, { recursive: true, force: true });
console.log("Copied Monaco editor runtime to public/monaco/vs");
