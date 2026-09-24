#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Toolyo — deploy-test.mjs
//
// Genera la aplicación completa y la despliega en un entorno Docker aislado
// para pruebas. Compatible con Windows, macOS y Linux (requiere Node.js 20+).
//
// Permite elegir por tag del repositorio o el último código disponible.
// Soporta carga de datos personalizada vía documento externo (--seed).
//
// Ver docs/09-entornos-y-despliegue.md para contexto de arquitectura.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "fs";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir, platform, homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DEV_DIR = path.join(REPO_ROOT, "development");
const COMPOSE_FILE = path.join(__dirname, "docker-compose.test.yml");
const IMPORTER_FILE = path.join(__dirname, "import-data.ts");

const IS_WINDOWS = platform() === "win32";

// ── Colors (disabled if not a TTY) ──
const isTTY = process.stdout.isTTY;
const C = isTTY
  ? {
      red: "\x1b[0;31m",
      green: "\x1b[0;32m",
      yellow: "\x1b[1;33m",
      blue: "\x1b[0;34m",
      bold: "\x1b[1m",
      nc: "\x1b[0m",
    }
  : { red: "", green: "", yellow: "", blue: "", bold: "", nc: "" };

const log = (m) => console.log(`${C.blue}[deploy-test]${C.nc} ${m}`);
const ok = (m) => console.log(`${C.green}[deploy-test]${C.nc} ${m}`);
const warn = (m) => console.log(`${C.yellow}[deploy-test]${C.nc} ${m}`);
const err = (m) => console.error(`${C.red}[deploy-test]${C.nc} ${m}`);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Run a command, inherit stdio, throw on non-zero exit. */
function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${cmd} ${args.join(" ")}`);
  }
  return result;
}

/** Run a command, capture stdout as string. Returns null on failure. */
function runCapture(cmd, args) {
  try {
    const stdout = execFileSync(cmd, args, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return stdout.trim();
  } catch {
    return null;
  }
}

/** Check if a command exists in PATH. */
function commandExists(cmd) {
  const checkCmd = IS_WINDOWS ? "where" : "which";
  const result = spawnSync(checkCmd, [cmd], { stdio: "ignore" });
  return result.status === 0;
}

/**
 * Convert a local path to a Docker volume mount path.
 * On Windows with Docker Desktop, paths like C:\Users\... work directly
 * when quoted, but we normalize to forward slashes for safety.
 */
function toDockerPath(p) {
  let normalized = path.resolve(p);
  if (IS_WINDOWS) {
    // Docker Desktop on Windows accepts C:\Users\... style paths with forward slashes
    normalized = normalized.replace(/\\/g, "/");
  }
  return normalized;
}

/** Sleep helper. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Check if a TCP port is free on localhost. Cross-platform (Windows/macOS/Linux).
 * Uses node:net to attempt a bind — no external dependencies.
 */
function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        tester.close(() => resolve(true));
      })
      .listen(port, "127.0.0.1");
  });
}

/**
 * Find a free port starting from `startPort`, trying up to `maxTries` ports.
 * Returns the first free port found, or null if none are free.
 */
async function findFreePort(startPort, maxTries = 20) {
  for (let p = startPort; p < startPort + maxTries; p++) {
    if (await isPortFree(p)) return p;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse arguments
// ─────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const opts = {
  tag: "",
  seedFile: "",
  hostPort: "3100",
  projectName: "",
  noBuild: false,
  cleanup: false,
  downOnly: false,
};

function showHelp() {
  console.log(`
${C.bold}Uso:${C.nc} node scripts/deploy-test.mjs [OPCIONES]

Genera y despliega la aplicación Toolyo en un entorno Docker aislado para pruebas.
Compatible con Windows, macOS y Linux.

${C.bold}Opciones:${C.nc}
  --tag <git-tag>      Desplegar desde un tag específico del repo (ej: v1.0.0)
  --latest             Usar el código actual del directorio de trabajo (por defecto)
  --seed <archivo>     Documento de carga de datos (.ts, .js o .json) tras el despliegue
  --port <puerto>      Puerto del host para exponer la app (por defecto: 3100)
  --name <nombre>      Nombre del proyecto para aislamiento (por defecto: auto)
  --no-build           Saltar el build de la imagen, usar una existente
  --cleanup            Eliminar contenedores y volúmenes al terminar (Ctrl+C)
  --down               Detener y eliminar un entorno existente (requiere --name)
  --help, -h           Mostrar esta ayuda

${C.bold}Formatos de --seed:${C.nc}
  .ts    Script TypeScript ejecutado con tsx dentro del contenedor
  .js    Script JavaScript ejecutado con node dentro del contenedor
  .json  Documento de datos importado con scripts/import-data.ts
         Formato: { "ModelName": [ { "campo": "valor" }, ... ] }

${C.bold}Ejemplos:${C.nc}
  # Desplegar el código actual con seed por defecto
  node scripts/deploy-test.mjs

  # Desplegar un tag específico
  node scripts/deploy-test.mjs --tag v1.0.0

  # Desplegar con datos personalizados
  node scripts/deploy-test.mjs --seed ./datos-prueba.json
  node scripts/deploy-test.mjs --tag v1.0.0 --seed ./seed-personalizado.ts --port 8080

  # Entorno efímero que se limpia al parar
  node scripts/deploy-test.mjs --cleanup --port 3001

  # Detener y limpiar un entorno existente
  node scripts/deploy-test.mjs --down --name toolyo-test-1234567890
`);
}

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--tag":      opts.tag = args[++i] ?? ""; break;
    case "--latest":   opts.tag = ""; break;
    case "--seed":     opts.seedFile = args[++i] ?? ""; break;
    case "--port":     opts.hostPort = args[++i] ?? "3000"; break;
    case "--name":     opts.projectName = args[++i] ?? ""; break;
    case "--no-build": opts.noBuild = true; break;
    case "--cleanup":  opts.cleanup = true; break;
    case "--down":     opts.downOnly = true; break;
    case "--help":
    case "-h":         showHelp(); process.exit(0);
    default:           err(`Opción desconocida: ${args[i]}`); showHelp(); process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// State for cleanup
// ─────────────────────────────────────────────────────────────────────────────
let tempBuildDir = "";
let imageTag = "";
let seederImage = "";
let projectName = "";

async function cleanup() {
  if (tempBuildDir && existsSync(tempBuildDir)) {
    try { rmSync(tempBuildDir, { recursive: true, force: true }); } catch {}
  }
  if (opts.cleanup && projectName) {
    log(`Limpiando entorno ${projectName}...`);
    // docker compose down no necesita las imágenes reales, pero las vars
    // deben estar presentes para que compose no falle parseando el yml
    const downEnv = { ...process.env, IMAGE_TAG: imageTag || "dummy", SEEDER_IMAGE: seederImage || "dummy", HOST_PORT: opts.hostPort };
    try {
      spawnSync("docker", ["compose", "-p", projectName, "-f", COMPOSE_FILE, "down", "-v", "--remove-orphans"], {
        stdio: "inherit",
        env: downEnv,
      });
    } catch {}
    if (imageTag) {
      try { run("docker", ["rmi", imageTag, seederImage]); } catch {}
    }
  }
}

// Handle Ctrl+C / SIGTERM
process.on("SIGINT", async () => {
  console.log();
  await cleanup();
  process.exit(130);
});
process.on("SIGTERM", async () => {
  await cleanup();
  process.exit(143);
});
process.on("exit", () => {
  if (tempBuildDir && existsSync(tempBuildDir)) {
    try { rmSync(tempBuildDir, { recursive: true, force: true }); } catch {}
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Down mode
// ─────────────────────────────────────────────────────────────────────────────
if (opts.downOnly) {
  if (!opts.projectName) {
    err("Se requiere --name para --down. Lista de entornos activos:");
    try { run("docker", ["compose", "ls"]); } catch {}
    process.exit(1);
  }
  log(`Deteniendo entorno ${opts.projectName}...`);
  const downEnv = { ...process.env, IMAGE_TAG: "dummy", SEEDER_IMAGE: "dummy", HOST_PORT: "0" };
  run("docker", ["compose", "-p", opts.projectName, "-f", COMPOSE_FILE, "down", "-v", "--remove-orphans"], { env: downEnv });
  ok(`Entorno ${opts.projectName} eliminado.`);
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Validate prerequisites
// ─────────────────────────────────────────────────────────────────────────────
log("Verificando prerrequisitos...");

// Check docker
const dockerInfo = spawnSync("docker", ["info"], { stdio: "ignore" });
if (dockerInfo.status !== 0) {
  err("Docker no está corriendo. Inicia Docker Desktop y vuelve a intentarlo.");
  process.exit(1);
}

// Check docker compose v2
const composeVer = spawnSync("docker", ["compose", "version"], { stdio: "ignore" });
if (composeVer.status !== 0) {
  err("Docker Compose v2 no está disponible. Instálalo desde Docker Desktop.");
  process.exit(1);
}

if (!existsSync(COMPOSE_FILE)) {
  err(`No se encontró ${COMPOSE_FILE}`);
  process.exit(1);
}

if (opts.seedFile && !existsSync(opts.seedFile)) {
  err(`Archivo de seed no encontrado: ${opts.seedFile}`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Determine build context: tag checkout vs current working directory
// ─────────────────────────────────────────────────────────────────────────────
let buildContext;
let version;

if (opts.tag) {
  log(`Preparando código del tag: ${opts.tag}`);

  // Fetch tags from remote
  runCapture("git", ["-C", REPO_ROOT, "fetch", "--tags"]);

  // Verify tag exists
  const tagCommit = runCapture("git", ["-C", REPO_ROOT, "rev-parse", `${opts.tag}^{commit}`]);
  if (!tagCommit) {
    err(`Tag no encontrado: ${opts.tag}`);
    warn("Tags disponibles:");
    const tags = runCapture("git", ["-C", REPO_ROOT, "tag", "-l", "v*"]);
    if (tags) {
      tags.split("\n").slice(0, 20).forEach((t) => warn(`  ${t}`));
    } else {
      warn("  (no hay tags v* en el repo todavía)");
    }
    process.exit(1);
  }

  // Create temp dir and extract tag contents
  tempBuildDir = mkdtempSync(path.join(tmpdir(), "toolyo-test-"));
  log(`Extrayendo código a ${tempBuildDir}...`);

  // git archive <tag> | tar -x -C <tempdir>
  // Use Node to pipe: spawn git archive, pipe to tar
  const { spawn } = await import("node:child_process");
  const archive = spawn("git", ["-C", REPO_ROOT, "archive", opts.tag]);
  const extract = spawn("tar", ["-x", "-C", tempBuildDir], {
    stdio: ["pipe", "inherit", "inherit"],
  });

  await new Promise((resolve, reject) => {
    archive.stdout.pipe(extract.stdin);
    archive.on("error", reject);
    extract.on("error", reject);
    extract.on("close", (code) => {
      if (code !== 0) reject(new Error(`tar exited with ${code}`));
      else resolve();
    });
  });

  buildContext = path.join(tempBuildDir, "development");
  version = opts.tag;
} else {
  log("Usando código actual del directorio de trabajo");
  buildContext = DEV_DIR;
  const shortHash = runCapture("git", ["-C", REPO_ROOT, "rev-parse", "--short", "HEAD"]) || "unknown";
  version = `latest-${shortHash}`;
}

if (!existsSync(buildContext) || !statSync(buildContext).isDirectory()) {
  err(`Directorio de build no encontrado: ${buildContext}`);
  process.exit(1);
}

const dockerfilePath = path.join(buildContext, "Dockerfile");
if (!existsSync(dockerfilePath)) {
  err(`No se encontró Dockerfile en ${buildContext}`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Project name for isolation
// ─────────────────────────────────────────────────────────────────────────────
projectName = opts.projectName || `toolyo-test-${Math.floor(Date.now() / 1000)}`;
imageTag = `toolyo-test:${projectName}`;
seederImage = `toolyo-test-seeder:${projectName}`;

// ─────────────────────────────────────────────────────────────────────────────
// Port detection: avoid conflicts with the dev environment (port 3000).
// The test stack defaults to 3100 and auto-increments if it's already in use.
// ─────────────────────────────────────────────────────────────────────────────
const requestedPort = parseInt(opts.hostPort, 10);
log(`Verificando disponibilidad del puerto ${requestedPort}...`);

let actualPort = requestedPort;
if (!(await isPortFree(requestedPort))) {
  warn(`El puerto ${requestedPort} está en uso (¿tienes el dev o otro entorno corriendo?).`);
  warn(`Buscando un puerto libre a partir del ${requestedPort + 1}...`);
  const freePort = await findFreePort(requestedPort + 1, 50);
  if (!freePort) {
    err(`No se encontró ningún puerto libre en el rango ${requestedPort}-${requestedPort + 50}.`);
    err("Especifica un puerto manualmente con --port <puerto>.");
    process.exit(1);
  }
  actualPort = freePort;
  ok(`Puerto alternativo encontrado: ${actualPort}`);
  opts.hostPort = String(actualPort);
}

console.log();
log(`${C.bold}Configuración del entorno:${C.nc}`);
log(`  Proyecto:  ${projectName}`);
log(`  Versión:   ${version}`);
log(`  Puerto:    ${opts.hostPort}${actualPort !== requestedPort ? " (auto)" : ""}`);
log(`  Build ctx: ${buildContext}`);
if (opts.seedFile) {
  log(`  Seed:      ${opts.seedFile}`);
} else {
  log(`  Seed:      (por defecto)`);
}
console.log();

// ─────────────────────────────────────────────────────────────────────────────
// Build images
// ─────────────────────────────────────────────────────────────────────────────
if (!opts.noBuild) {
  log("Construyendo imagen de aplicación (producción)...");
  run("docker", ["build", "-t", imageTag, buildContext]);
  ok(`Imagen app construida: ${imageTag}`);

  log("Construyendo imagen de seeding (con dependencias de dev)...");
  run("docker", ["build", "--target", "builder", "-t", seederImage, buildContext]);
  ok(`Imagen seeder construida: ${seederImage}`);
} else {
  log("Saltando build (--no-build)");
  const appCheck = spawnSync("docker", ["image", "inspect", imageTag], { stdio: "ignore" });
  if (appCheck.status !== 0) {
    err(`Imagen app no encontrada: ${imageTag}`);
    err("Ejecuta sin --no-build primero para construirla.");
    process.exit(1);
  }
  const seederCheck = spawnSync("docker", ["image", "inspect", seederImage], { stdio: "ignore" });
  if (seederCheck.status !== 0) {
    err(`Imagen seeder no encontrada: ${seederImage}`);
    err("Ejecuta sin --no-build primero para construirla.");
    process.exit(1);
  }
  ok("Reutilizando imágenes existentes.");
}

// ─────────────────────────────────────────────────────────────────────────────
// Start the isolated stack
// ─────────────────────────────────────────────────────────────────────────────
const composeEnv = {
  ...process.env,
  IMAGE_TAG: imageTag,
  SEEDER_IMAGE: seederImage,
  HOST_PORT: opts.hostPort,
};

log("Levantando entorno Docker aislado...");
const upResult = spawnSync("docker", ["compose", "-p", projectName, "-f", COMPOSE_FILE, "up", "-d", "--build"], {
  stdio: "inherit",
  env: composeEnv,
});
if (upResult.status !== 0) {
  err("Error levantando el entorno Docker.");
  err("Limpiando recursos parciales...");
  // Clean up partial deployment (db container, network, volume) to avoid leftovers
  spawnSync("docker", ["compose", "-p", projectName, "-f", COMPOSE_FILE, "down", "-v", "--remove-orphans"], {
    stdio: "ignore",
    env: composeEnv,
  });
  process.exit(1);
}
ok("Contenedores iniciados.");

// ─────────────────────────────────────────────────────────────────────────────
// Wait for app to be healthy
// ─────────────────────────────────────────────────────────────────────────────
log("Esperando a que la aplicación esté lista...");
const MAX_WAIT = 120;
let waited = 0;
let appReady = false;

// Use http module for health check (no external dependency)
const http = await import("node:http");

function checkHealth(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/health`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(3000, () => { req.destroy(); resolve(false); });
  });
}

while (waited < MAX_WAIT) {
  if (await checkHealth(opts.hostPort)) {
    appReady = true;
    break;
  }
  await sleep(2000);
  waited += 2;
  if (waited % 10 === 0) {
    log(`  ...esperando (${waited}s)`);
  }
}

if (appReady) {
  ok(`Aplicación lista después de ${waited}s`);
  ok(`Healthcheck OK: http://localhost:${opts.hostPort}/api/health`);
} else {
  warn(`La aplicación no respondió al healthcheck en ${MAX_WAIT}s.`);
  warn(`Logs: docker compose -p ${projectName} -f ${COMPOSE_FILE} logs app`);
  warn("Continuando con la carga de datos de todas formas...");
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data loading
// ─────────────────────────────────────────────────────────────────────────────
console.log();

/** Build a docker compose run command with volume mounts. */
function composeRun(volumeMounts, command) {
  const args = ["compose", "-p", projectName, "-f", COMPOSE_FILE, "run", "--rm"];
  for (const [hostPath, containerPath] of volumeMounts) {
    args.push("-v", `${toDockerPath(hostPath)}:${containerPath}`);
  }
  args.push("seeder", ...command);
  return run("docker", args, { env: composeEnv });
}

if (opts.seedFile) {
  log(`Cargando datos desde: ${opts.seedFile}`);
  const seedAbs = path.resolve(opts.seedFile);
  const seedBasename = path.basename(opts.seedFile);
  const ext = seedBasename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "ts":
      log(`Ejecutando seed script TypeScript: ${seedBasename}`);
      composeRun([[seedAbs, "/app/custom-seed.ts"]], ["npx", "tsx", "/app/custom-seed.ts"]);
      break;
    case "js":
      log(`Ejecutando seed script JavaScript: ${seedBasename}`);
      composeRun([[seedAbs, "/app/custom-seed.js"]], ["node", "/app/custom-seed.js"]);
      break;
    case "json":
      log(`Importando documento JSON: ${seedBasename}`);
      composeRun(
        [
          [seedAbs, "/app/custom-data.json"],
          [IMPORTER_FILE, "/app/import-data.ts"],
        ],
        ["npx", "tsx", "/app/import-data.ts", "/app/custom-data.json"],
      );
      break;
    default:
      err(`Formato de seed no soportado: .${ext} (usa .ts, .js o .json)`);
      warn("Saltando carga de datos personalizada.");
  }
  ok("Carga de datos completada.");
} else {
    log("Aplicando migraciones (prisma migrate deploy)...");

    // migrate deploy aplica también triggers/funciones de los .sql (p.ej.
    // booking_status_history_immutable), que `db push` ignora.
    await composeRun([], ["npx", "prisma", "migrate", "deploy"]);

    log("Ejecutando seed por defecto (prisma db seed)...");
    await composeRun([], ["npx", "prisma", "db", "seed"]);
    ok("Seed por defecto completado.");
  }

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log();
ok(`${C.bold}═══════════════════════════════════════════════════════════${C.nc}`);
ok(`${C.bold} Entorno de prueba desplegado${C.nc}`);
ok(`${C.bold}═══════════════════════════════════════════════════════════${C.nc}`);
ok(`  URL:       http://localhost:${opts.hostPort}`);
ok(`  Health:    http://localhost:${opts.hostPort}/api/health`);
ok(`  Proyecto:  ${projectName}`);
ok(`  Versión:   ${version}`);
ok(`${C.bold}═══════════════════════════════════════════════════════════${C.nc}`);
console.log();
log(`Logs:       docker compose -p ${projectName} -f ${COMPOSE_FILE} logs -f`);
log(`Detener:     node scripts/deploy-test.mjs --down --name ${projectName}`);
console.log();

if (opts.cleanup) {
  log(`${C.bold}Modo --cleanup activado.${C.nc} El entorno se eliminará al pulsar Ctrl+C.`);
  log("Pulsa Ctrl+C para detener y limpiar.");
  // Keep the process alive so SIGINT handler runs cleanup
  await new Promise(() => {});
} else {
  log("El entorno sigue corriendo. Usa --down para detenerlo cuando termines.");
}
