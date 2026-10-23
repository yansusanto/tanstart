#!/usr/bin/env node
// One-time production setup for the auth module. Creates the D1 database, records its id, applies migrations.
import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const config = JSON.parse(
  readFileSync('wrangler.jsonc', 'utf8').replace(/^\s*\/\/.*$/gm, ''),
)
const db = config.d1_databases?.find((d) => d.binding === 'DB')
if (!db) throw new Error('No DB binding in wrangler.jsonc. Run: yarn add-module auth')

if (!db.database_id) {
  console.log(`Creating D1 database "${db.database_name}"...`)
  const out = execSync(`npx wrangler d1 create ${db.database_name}`, {
    encoding: 'utf8',
  })
  const id = out.match(/"database_id":\s*"([0-9a-f-]{36})"/)?.[1]
  if (!id) throw new Error(`Could not read database_id from:\n${out}`)
  db.database_id = id
  writeFileSync('wrangler.jsonc', `${JSON.stringify(config, null, 2)}\n`)
  console.log(`Saved database_id ${id} to wrangler.jsonc.`)
} else {
  console.log(`Database already has an id (${db.database_id}).`)
}

console.log('Applying migrations to the remote database...')
execSync('yarn -s db:migrate:remote', { stdio: 'inherit' })

console.log(`
Next, add the secret to the Worker (dashboard: Workers & Pages > ${config.name} > Settings > Variables and secrets,
or: npx wrangler secret put BETTER_AUTH_SECRET). Use a new random value, for example:

  ${randomBytes(32).toString('base64')}

For optional Google sign-in, also add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET as secrets, with the redirect URI
https://<your-domain>/api/auth/callback/google in the Google Cloud OAuth client.

Then commit wrangler.jsonc (it now holds the database id) and deploy.`)
