#!/usr/bin/env node
// Optional feature modules. Usage:
//   yarn add-module            list modules
//   yarn add-module <name>     add a module to this project
// A module is a folder in modules/<name>/ with a module.json and a files/ tree that is copied into the project root.
import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const modulesDir = join(root, 'modules')
const read = (p) => readFileSync(join(root, p), 'utf8')
const write = (p, s) => writeFileSync(join(root, p), s)
const readJson = (p, fallback) =>
  existsSync(join(root, p)) ? JSON.parse(read(p).replace(/^\s*\/\/.*$/gm, '')) : fallback

export function listModules() {
  if (!existsSync(modulesDir)) return []
  return readdirSync(modulesDir)
    .filter((n) => existsSync(join(modulesDir, n, 'module.json')))
    .map((n) => JSON.parse(readFileSync(join(modulesDir, n, 'module.json'), 'utf8')))
}

function* walk(dir, base = dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) yield* walk(full, base)
    else yield full.slice(base.length + 1)
  }
}

const fill = (s, vars) => s.replaceAll('__NAME__', vars.name)

export function addModule(name, { install = true } = {}) {
  const dir = join(modulesDir, name)
  if (!existsSync(join(dir, 'module.json'))) {
    throw new Error(`Unknown module "${name}". Available: ${listModules().map((m) => m.name).join(', ') || 'none'}`)
  }
  const mod = JSON.parse(readFileSync(join(dir, 'module.json'), 'utf8'))
  // Required modules first (installed once, in order)
  const have = readJson('starter.json', { modules: [] }).modules
  for (const req of mod.requires ?? []) {
    if (!have.includes(req)) {
      console.log(`Module "${name}" requires "${req}". Adding it first.`)
      addModule(req, { install })
    }
  }

  const pkg = readJson('package.json')
  const vars = { name: pkg.name }
  const starter = readJson('starter.json', { modules: [] })
  const report = { copied: [], skipped: [] }

  // 1. Files
  const filesDir = join(dir, 'files')
  if (existsSync(filesDir)) {
    for (const rel of walk(filesDir)) {
      const dest = join(root, rel)
      if (existsSync(dest) && !mod.overwrite?.includes(rel)) {
        report.skipped.push(rel)
        continue
      }
      mkdirSync(dirname(dest), { recursive: true })
      if (existsSync(dest)) report.overwritten = [...(report.overwritten ?? []), rel]
      copyFileSync(join(filesDir, rel), dest)
      report.copied.push(rel)
    }
  }

  // 2. package.json
  for (const key of ['dependencies', 'devDependencies', 'scripts']) {
    if (mod[key]) pkg[key] = { ...pkg[key], ...mod[key] }
  }
  write('package.json', `${JSON.stringify(pkg, null, 2)}\n`)

  // 3. wrangler.jsonc: merge array settings (such as d1_databases) by binding, plain keys if missing
  if (mod.wrangler) {
    const cfg = readJson('wrangler.jsonc')
    for (const [key, value] of Object.entries(JSON.parse(fill(JSON.stringify(mod.wrangler), vars)))) {
      if (Array.isArray(value)) {
        const have = cfg[key] ?? []
        for (const item of value) {
          if (!have.some((h) => h.binding && h.binding === item.binding)) have.push(item)
        }
        cfg[key] = have
      } else if (cfg[key] === undefined) cfg[key] = value
    }
    write('wrangler.jsonc', `${JSON.stringify(cfg, null, 2)}\n`)
  }

  // 4. Local secrets in .dev.vars (random values, never overwritten)
  if (mod.secrets?.length) {
    let vs = existsSync(join(root, '.dev.vars')) ? read('.dev.vars') : ''
    for (const key of mod.secrets) {
      if (!new RegExp(`^${key}=`, 'm').test(vs)) {
        vs += `${vs && !vs.endsWith('\n') ? '\n' : ''}${key}=${randomBytes(32).toString('base64')}\n`
      }
    }
    write('.dev.vars', vs)
  }

  // 5. .gitignore
  if (mod.gitignore?.length) {
    let gi = existsSync(join(root, '.gitignore')) ? read('.gitignore') : ''
    for (const line of mod.gitignore) {
      if (!gi.split('\n').includes(line)) gi += `${gi && !gi.endsWith('\n') ? '\n' : ''}${line}\n`
    }
    write('.gitignore', gi)
  }

  // 6. Record the module
  if (!starter.modules.includes(name)) starter.modules.push(name)
  write('starter.json', `${JSON.stringify(starter, null, 2)}\n`)

  // 7. Install and post steps
  if (install) {
    execSync('yarn install', { cwd: root, stdio: 'inherit' })
    for (const cmd of mod.postAdd ?? []) execSync(cmd, { cwd: root, stdio: 'inherit' })
  }

  console.log(`\nAdded module "${name}": ${report.copied.length} files copied${report.overwritten ? ` (replaced ${report.overwritten.join(', ')})` : ''}${report.skipped.length ? `, ${report.skipped.length} already existed and were kept (${report.skipped.join(', ')})` : ''}.`)
  for (const note of mod.notes ?? []) console.log(`  - ${note}`)
  return report
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const name = process.argv[2]
  if (!name) {
    for (const m of listModules()) console.log(`${m.name.padEnd(12)} ${m.description}`)
  } else {
    try {
      addModule(name)
    } catch (e) {
      console.error(e.message)
      process.exit(1)
    }
  }
}
