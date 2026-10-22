#!/usr/bin/env node
// Run once after creating a project from this template: yarn init-site
// Sets the project name, then lets you pick a design from the awesome-claude-design collection.
import { execSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createInterface, emitKeypressEvents } from 'node:readline'
import { addModule, installedModules, listModules, removeModule, setupModule } from './modules.mjs'

const DEFAULT = 'cursor'
let rl
let lines
const open = () => {
  rl = createInterface({ input: process.stdin, output: process.stdout })
  lines = rl[Symbol.asyncIterator]()
}
open()
const ask = async (q) => {
  process.stdout.write(q)
  const { value } = await lines.next()
  return (value ?? '').trim()
}

// Arrow-key menu: up/down to move, Enter to choose. Without a terminal (piped input) it asks for a number instead.
async function select(title, options) {
  console.log(`\n${title}`)
  if (!process.stdin.isTTY) {
    options.forEach((o, i) => console.log(`${String(i + 1).padStart(3)}  ${o.label}${o.hint ? `  ${o.hint}` : ''}`))
    const n = Number(await ask('\nNumber (Enter = 1): '))
    return options[n >= 1 && n <= options.length ? n - 1 : 0].value
  }
  rl.close()
  emitKeypressEvents(process.stdin)
  process.stdin.setRawMode(true)
  process.stdin.resume()
  let i = 0
  const draw = (first) => {
    if (!first) process.stdout.write(`\x1b[${options.length}A`)
    options.forEach((o, n) => {
      const on = n === i
      process.stdout.write(`\x1b[2K${on ? '\x1b[36m❯\x1b[0m' : ' '} ${on ? `\x1b[1m${o.label}\x1b[0m` : o.label}${o.hint ? `\x1b[2m  ${o.hint}\x1b[0m` : ''}\n`)
    })
  }
  draw(true)
  await new Promise((resolve) => {
    const onKey = (_, key) => {
      if (key.ctrl && key.name === 'c') process.exit(130)
      if (key.name === 'up') i = (i + options.length - 1) % options.length
      else if (key.name === 'down') i = (i + 1) % options.length
      else if (key.name === 'return') {
        process.stdin.off('keypress', onKey)
        return resolve()
      }
      draw(false)
    }
    process.stdin.on('keypress', onKey)
  })
  process.stdin.setRawMode(false)
  process.stdin.pause()
  open()
  return options[i].value
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// 1. Name
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const oldName = pkg.name
const name = slugify((await ask(`Project name [${pkg.name}]: `)) || pkg.name)
pkg.name = name
writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`)
const wr = readFileSync('wrangler.jsonc', 'utf8')
writeFileSync('wrangler.jsonc', wr.replace(/"name":\s*"[^"]*"/, `"name": "${name}"`))
// A renamed site gets its own D1 database name and must not inherit the template's database id.
if (name !== oldName) {
  const cfg = JSON.parse(readFileSync('wrangler.jsonc', 'utf8').replace(/^\s*\/\/.*$/gm, ''))
  for (const d of cfg.d1_databases ?? []) {
    d.database_name = `${name}-db`
    delete d.database_id
  }
  writeFileSync('wrangler.jsonc', `${JSON.stringify(cfg, null, 2)}\n`)
}
console.log(`Named "${name}" in package.json and wrangler.jsonc.\n`)

// 2. Design
const brands = execSync('yarn -s getdesign list', { encoding: 'utf8' })
  .split('\n')
  .map((l) => l.replace(/\x1b\[[0-9;]*m/g, '').match(/^\s*([a-z0-9.-]+) - (.*)$/))
  .filter(Boolean)
  .map(([, id, desc]) => ({ id, desc }))

const show = (list) =>
  list.forEach((b, i) => console.log(`${String(i + 1).padStart(3)}  ${b.id.padEnd(14)} ${b.desc}`))

let chosen
let view = brands
show(view)
while (!chosen) {
  const a = await ask(
    `\nDesign: number, name, or text to filter (Enter = ${DEFAULT}): `,
  )
  if (!a) chosen = DEFAULT
  else if (/^\d+$/.test(a) && view[Number(a) - 1]) chosen = view[Number(a) - 1].id
  else if (brands.some((b) => b.id === a)) chosen = a
  else {
    view = brands.filter((b) => `${b.id} ${b.desc}`.toLowerCase().includes(a.toLowerCase()))
    if (view.length === 0) {
      console.log('No match.')
      view = brands
    }
    show(view)
  }
}
// 3. Modules: the starter ships with some installed. Keep or remove them, then offer the rest.
const all = listModules()
const installed = installedModules()
const parse = (text, pool) =>
  text
    .split(/[,\s]+/)
    .filter(Boolean)
    .map((t) => (/^\d+$/.test(t) ? pool[Number(t) - 1]?.name : t))
    .filter(Boolean)

let keep = installed
if (installed.length) {
  // One option per step: everything installed, then fewer modules, down to none.
  const info = (n) => all.find((m) => m.name === n)
  const options = installed
    .map((_, n) => installed.length - n)
    .map((count) => {
      const set = installed.slice(0, count)
      return {
        value: set,
        label: set.map((n, k) => (k ? (info(n).label ?? n).toLowerCase() : (info(n).label ?? n))).join(' and ') + (count === installed.length ? ' (recommended)' : ''),
        hint: set.map((n) => info(n).summary).filter(Boolean).join('; '),
      }
    })
  options.push({ value: [], label: 'Landing page only', hint: 'No login and no database' })
  keep = await select('What should this site include?', options)
}
const extras = all.filter((m) => !installed.includes(m.name))
let picked = []
if (extras.length) {
  console.log('\nOptional modules:')
  extras.forEach((m, i) => console.log(`${String(i + 1).padStart(3)}  ${m.name.padEnd(12)} ${m.description}`))
  picked = parse(await ask('\nAdd modules: numbers or names separated by commas (Enter = none): '), extras)
}
rl.close()

// 4. Apply design
spawnSync('yarn', ['-s', 'design', chosen, '--force'], { stdio: 'inherit' })
const cached = `themes/${chosen}.css`
if (existsSync(cached)) {
  copyFileSync(cached, 'src/theme.css')
  console.log(`\nApplied saved theme ${cached}.`)
} else {
  console.log(`\nDESIGN.md for "${chosen}" is downloaded. Next, map it to src/theme.css:`)
  const hasClaude = spawnSync('claude', ['--version'], { stdio: 'ignore' }).status === 0
  if (hasClaude) {
    console.log('Running Claude Code to apply it...\n')
    spawnSync('claude', ['-p', `/apply-design ${chosen}`, '--permission-mode', 'acceptEdits',
      "--allowedTools",
      "Bash(yarn:*)",], {
      stdio: 'inherit',
    })
  } else {
    console.log(`  claude  then  /apply-design ${chosen}`)
  }
}

// 5. Modules: remove what was not kept (dependents first), set up what was kept, add extras
for (const m of [...installed].reverse()) {
  if (!keep.includes(m)) {
    try {
      removeModule(m, { install: false })
    } catch (e) {
      console.error(e.message)
    }
  }
}
if (installed.some((m) => !keep.includes(m))) execSync('yarn install', { stdio: 'inherit' })
for (const m of installed.filter((m) => keep.includes(m))) setupModule(m)
for (const m of picked) {
  try {
    addModule(m)
  } catch (e) {
    console.error(e.message)
  }
}

console.log('\nDone. Start with: yarn dev')
