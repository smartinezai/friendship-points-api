import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildOpenApiDocument } from "../src/openapi/openapiDocument.js";

const outputPath = fileURLToPath(new URL("../docs/openapi.json", import.meta.url));
const document = buildOpenApiDocument();

await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`);
process.stdout.write(`Wrote ${outputPath}\n`);
