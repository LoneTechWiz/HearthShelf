import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { randomBytes } from "node:crypto"

const target = ".env.test"
const example = ".env.test.example"

if (existsSync(target)) {
  console.log(`${target} already exists — leaving it untouched.`)
  process.exit(0)
}

const secret = randomBytes(32).toString("base64")
const content = readFileSync(example, "utf8").replace(
  /^AUTH_SECRET=.*$/m,
  `AUTH_SECRET=${secret}`
)
writeFileSync(target, content)
console.log(`Created ${target} with a generated AUTH_SECRET.`)
