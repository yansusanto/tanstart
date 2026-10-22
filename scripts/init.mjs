#!/usr/bin/env node
// Run once after creating a project from this template: yarn init-site
// Sets the project name, then lets you pick a design from the awesome-claude-design collection.
import { execSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'

const DEFAULT = 'cursor'
const rl = createInterface({ input: process.stdin, output: process.stdout })
const lines = rl[Symbol.asyncIterator]()
const ask = async (q) => {
  process.stdout.write(q)
  const { value } = await lines.next()
  return (value ?? '').trim()
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// 1. Name
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const name = slugify((await ask(`Project name [${pkg.name}]: `)) || pkg.name)
pkg.name = name
writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`)
const wr = readFileSync('wrangler.jsonc', 'utf8')
writeFileSync('wrangler.jsonc', wr.replace(/"name":\s*"[^"]*"/, `"name": "${name}"`))
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
rl.close()

// 3. Apply
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
console.log('\nDone. Start with: yarn dev')
