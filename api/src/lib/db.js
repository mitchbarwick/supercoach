// Cosmos DB data layer. One database, three containers.
// getContainers() hands out references without touching the network, so
// a cold start doesn't pay four "create if missing" round trips before
// it can serve a request. ensureContainers() does that creation; it runs
// from /api/ping and the keep-warm timer, so a brand-new database is set
// up long before anyone signs in.
import { CosmosClient } from '@azure/cosmos'

const DB = 'supercoach'
const SPECS = [
  { id: 'users', partitionKey: { paths: ['/id'] } },
  { id: 'programs', partitionKey: { paths: ['/userId'] } },
  { id: 'feedback', partitionKey: { paths: ['/id'] } },
]

let client = null
const cosmos = () => (client ||= new CosmosClient(process.env.COSMOS_CONNECTION_STRING))

let containers = null
export function getContainers() {
  if (!containers) {
    const db = cosmos().database(DB)
    const [users, programs, feedback] = SPECS.map((c) => db.container(c.id))
    containers = { users, programs, feedback }
  }
  return Promise.resolve(containers)
}

let ensured = null
export function ensureContainers() {
  if (!ensured) {
    ensured = (async () => {
      const { database } = await cosmos().databases.createIfNotExists({ id: DB })
      await Promise.all(SPECS.map((c) => database.containers.createIfNotExists(c)))
    })().catch((err) => { ensured = null; throw err })
  }
  return ensured
}

export async function countAll(container) {
  const { resources } = await container.items
    .query('SELECT VALUE COUNT(1) FROM c', { maxItemCount: 1 })
    .fetchAll()
  return resources[0] || 0
}
