#!/usr/bin/env node
// Optional feature modules. Usage:
//   yarn add-module              list modules and which are installed
//   yarn add-module <name>       add a module to this project
//   yarn remove-module <name>    remove a module (files, packages, bindings)
// A module is a folder in modules/<name>/ with a module.json and a files/ tree that is copied into the project root.
// starter.json records what is installed and which files each module copied, so a module can be removed cleanly.
import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
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
const loadState = () => {
  const s = readJson('starter.json', {})
  return { modules: s.modules ?? [], files: s.files ?? {} }
}
const saveState = (s) => write('starter.json', `${JSON.stringify(s, null, 2)}\n`)
const manifest = (name) => JSON.parse(readFileSync(join(modulesDir, name, 'module.json'), 'utf8'))

export function listModules() {
  if (!existsSync(modulesDir)) return []
  return readdirSync(modulesDir)
    .filter((n) => existsSync(join(modulesDir, n, 'module.json')))
    .map((n) => manifest(n))
}

export const installedModules = () => loadState().modules

function* walk(dir, base = dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) yield* walk(full, base)
    else yield full.slice(base.length + 1)
  }
}

const fill = (s, vars) => s.replaceAll('__NAME__', vars.name)

/** Local setup: random secrets in .dev.vars, then the module's postAdd commands (types, local migrations). */
export function setupModule(name) {
  const mod = manifest(name)
  if (mod.secrets?.length) {
    let vs = existsSync(join(root, '.dev.vars')) ? read('.dev.vars') : ''
    for (const key of mod.secrets) {
      if (!new RegExp(`^${key}=`, 'm').test(vs)) {
        vs += `${vs && !vs.endsWith('\n') ? '\n' : ''}${key}=${randomBytes(32).toString('base64')}\n`
      }
    }
    write('.dev.vars', vs)
  }
  // CI=1 keeps wrangler from asking to confirm local migrations.
  for (const cmd of mod.postAdd ?? []) execSync(cmd, { cwd: root, stdio: 'inherit', env: { ...process.env, CI: '1' } })
}

export function addModule(name, { install = true } = {}) {
  const dir = join(modulesDir, name)
  if (!existsSync(join(dir, 'module.json'))) {
    throw new Error(`Unknown module "${name}". Available: ${listModules().map((m) => m.name).join(', ') || 'none'}`)
  }
  const mod = manifest(name)
  const state = loadState()

  // Required modules first
  for (const req of mod.requires ?? []) {
    if (!state.modules.includes(req)) {
      console.log(`Module "${name}" requires "${req}". Adding it first.`)
      addModule(req, { install })
    }
  }
  const fresh = loadState()
  const pkg = readJson('package.json')
  const vars = { name: pkg.name }
  const record = fresh.files[name] ?? { copied: [], overwritten: [] }
  const report = { copied: [], skipped: [], overwritten: [] }

  // 1. Files
  const filesDir = join(dir, 'files')
  if (existsSync(filesDir)) {
    for (const rel of walk(filesDir)) {
      const dest = join(root, rel)
      const exists = existsSync(dest)
      if (exists && !mod.overwrite?.includes(rel)) {
        report.skipped.push(rel)
        continue
      }
      mkdirSync(dirname(dest), { recursive: true })
      copyFileSync(join(filesDir, rel), dest)
      if (exists) report.overwritten.push(rel)
      else report.copied.push(rel)
    }
  }
  record.copied = [...new Set([...record.copied, ...report.copied])]
  record.overwritten = [...new Set([...record.overwritten, ...report.overwritten])]

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

  // 4. .gitignore
  if (mod.gitignore?.length) {
    let gi = existsSync(join(root, '.gitignore')) ? read('.gitignore') : ''
    for (const line of mod.gitignore) {
      if (!gi.split('\n').includes(line)) gi += `${gi && !gi.endsWith('\n') ? '\n' : ''}${line}\n`
    }
    write('.gitignore', gi)
  }

  // 5. Patches: small text edits to existing files. Skipped (and reported) when the text is not found.
  for (const { file, find, replace } of mod.patches ?? []) {
    const text = existsSync(join(root, file)) ? read(file) : ''
    if (text.includes(find)) write(file, text.replace(find, replace))
    else if (!text.includes(replace)) report.skipped.push(`${file} (patch not applied: edit by hand)`)
  }

  // 6. Record
  if (!fresh.modules.includes(name)) fresh.modules.push(name)
  fresh.files[name] = record
  saveState(fresh)

  // 7. Install and local setup
  if (install) {
    execSync('yarn install', { cwd: root, stdio: 'inherit' })
    setupModule(name)
  }

  console.log(`\nAdded module "${name}": ${report.copied.length} files copied${report.overwritten.length ? ` (replaced ${report.overwritten.join(', ')})` : ''}${report.skipped.length ? `, ${report.skipped.length} already existed and were kept (${report.skipped.join(', ')})` : ''}.`)
  for (const note of mod.notes ?? []) console.log(`  - ${note}`)
  return report
}

export function removeModule(name, { install = true } = {}) {
  const state = loadState()
  if (!state.modules.includes(name)) throw new Error(`Module "${name}" is not installed.`)
  const dependents = state.modules.filter((m) => m !== name && (manifest(m).requires ?? []).includes(name))
  if (dependents.length) throw new Error(`Cannot remove "${name}": required by ${dependents.join(', ')}. Remove those first.`)

  const mod = manifest(name)
  const record = state.files[name] ?? { copied: [], overwritten: [] }
  const keep = (rel) => rel.startsWith('src/components/ui/') || rel.startsWith('src/hooks/') // generic shadcn components and hooks stay, other code may use them

  // Files the module created
  const dirs = new Set()
  for (const rel of record.copied) {
    if (keep(rel)) continue
    rmSync(join(root, rel), { force: true })
    dirs.add(dirname(rel))
  }
  // Files the module replaced: restore the version from a module it requires
  for (const rel of record.overwritten) {
    const source = (mod.requires ?? []).map((r) => join(modulesDir, r, 'files', rel)).find(existsSync)
    if (source) copyFileSync(source, join(root, rel))
    else rmSync(join(root, rel), { force: true })
  }
  for (let dir of dirs) {
    while (dir && dir !== '.' && existsSync(join(root, dir)) && readdirSync(join(root, dir)).length === 0) {
      rmdirSync(join(root, dir))
      dir = dirname(dir)
    }
  }

  // Patches in reverse
  for (const { file, find, replace } of mod.patches ?? []) {
    if (existsSync(join(root, file)) && read(file).includes(replace)) write(file, read(file).replace(replace, find))
  }

  // Packages and scripts, unless another installed module needs them
  const others = state.modules.filter((m) => m !== name).map(manifest)
  const pkg = readJson('package.json')
  for (const key of ['dependencies', 'devDependencies', 'scripts']) {
    for (const k of Object.keys(mod[key] ?? {})) {
      if (!others.some((o) => o[key]?.[k] !== undefined)) delete pkg[key]?.[k]
    }
  }
  write('package.json', `${JSON.stringify(pkg, null, 2)}\n`)

  // Wrangler bindings
  if (mod.wrangler) {
    const cfg = readJson('wrangler.jsonc')
    for (const [key, value] of Object.entries(mod.wrangler)) {
      if (Array.isArray(value) && Array.isArray(cfg[key])) {
        cfg[key] = cfg[key].filter((h) => !value.some((v) => v.binding && v.binding === h.binding))
        if (cfg[key].length === 0) delete cfg[key]
      } else delete cfg[key]
    }
    write('wrangler.jsonc', `${JSON.stringify(cfg, null, 2)}\n`)
  }

  state.modules = state.modules.filter((m) => m !== name)
  delete state.files[name]
  saveState(state)
  if (install) execSync('yarn install', { cwd: root, stdio: 'inherit' })
  console.log(`Removed module "${name}".`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, name] = process.argv.slice(2)
  const installed = installedModules()
  try {
    if (cmd === 'remove') removeModule(name)
    else if (cmd === 'setup') setupModule(name)
    else if (!cmd) {
      for (const m of listModules()) console.log(`${m.name.padEnd(12)} ${installed.includes(m.name) ? '[installed] ' : ''}${m.description}`)
    } else addModule(cmd)
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}
