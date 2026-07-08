// Cosmos DB data layer. One database, three containers.
// Containers are created on first use so provisioning only needs the
// account itself to exist.
import { CosmosClient } from '@azure/cosmos'

let containersPromise = null

export function getContainers() {
  if (!containersPromise) {
    containersPromise = (async () => {
      const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
      const { database } = await client.databases.createIfNotExists({ id: 'supercoach' })
      const [users, programs, feedback] = await Promise.all([
        database.containers.createIfNotExists({ id: 'users', partitionKey: { paths: ['/id'] } }),
        database.containers.createIfNotExists({ id: 'programs', partitionKey: { paths: ['/userId'] } }),
        database.containers.createIfNotExists({ id: 'feedback', partitionKey: { paths: ['/id'] } }),
      ])
      return { users: users.container, programs: programs.container, feedback: feedback.container }
    })().catch((err) => { containersPromise = null; throw err })
  }
  return containersPromise
}

export async function countAll(container) {
  const { resources } = await container.items
    .query('SELECT VALUE COUNT(1) FROM c', { maxItemCount: 1 })
    .fetchAll()
  return resources[0] || 0
}
