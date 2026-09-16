import { performance } from "node:perf_hooks";
import process from "node:process";
import { embedTexts } from "../src/lib/embeddings/embedding.service";

const examples = ["cámara de fotos", "equipo de escalada", "taladro percutor"];
const texts = Array.from(
  { length: 100 },
  (_, index) => `${examples[index % examples.length]} ${index + 1}`,
);

const rssMb = () => process.memoryUsage().rss / 1024 / 1024;

async function main(): Promise<void> {
  const loadStart = performance.now();
  await embedTexts([texts[0]!]);
  const loadMs = performance.now() - loadStart;

  const inferenceStart = performance.now();
  await embedTexts(texts);
  const inferenceMs = performance.now() - inferenceStart;

  console.log(`Model load time: ${loadMs.toFixed(2)} ms`);
  console.log(`Average embedding time: ${(inferenceMs / texts.length).toFixed(2)} ms`);
  console.log(`RPS: ${(texts.length / (inferenceMs / 1000)).toFixed(2)}`);
  console.log(`RSS memory: ${rssMb().toFixed(2)} MB`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
