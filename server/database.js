const { Client } = require('pg')
const { RDS } = require('aws-sdk')

function getEnv(key) {
  const env = process.env[key]
  if (env == null || env === '') {
    throw new Error(`Environment variable "${key}" is required`)
  }
  return env
}

function getClient() {
  switch (process.env.DBMODE) {
    case 'local': {
      const user = process.env.PGUSER || 'postgres'
      const host = process.env.PGHOST || 'localhost'
      const database = process.env.PGDATABASE || 'postgres'
      const password = process.env.PGPASSWORD || '12345'
      const port = parseInt(process.env.PGPORT) || 5432

      return new Client({
        user,
        host,
        database,
        password,
        port,
      })
    }
    case 'aws': {
      const accessKeyId = getEnv('CAPYBARA_AWS_ACCESS_KEY_ID')
      const secretAccessKey = getEnv('CAPYBARA_AWS_SECRET_ACCESS_KEY')
      const region = getEnv('CAPYBARA_AWS_POSTGRES_REGION')
      const hostname = getEnv('CAPYBARA_AWS_POSTGRES_HOSTNAME')
      const port = parseInt(getEnv('CAPYBARA_AWS_POSTGRES_PORT'))
      const username = getEnv('CAPYBARA_AWS_POSTGRES_USERNAME')
      const database = getEnv('CAPYBARA_AWS_POSTGRES_DATABASE')

      const signerOptions = {
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        region,
        hostname,
        port,
        username,
      }
      const signer = new RDS.Signer()
      const getPassword = () => signer.getAuthToken(signerOptions)

      return new Client({
        host: signerOptions.hostname,
        port: signerOptions.port,
        user: signerOptions.username,
        database,
        password: getPassword,
      })
    }
    default: {
      throw new Error('Environment variable "DBMODE" is required [local, aws]')
    }
  }
}

function escapeId(str) {
  return `"${String(str).replace(/(["])/gi, '$1$1')}"`
}

function escapeStr(str) {
  return `'${String(str).replace(/(['])/gi, '$1$1')}'`
}

async function executeStatement(sql) {
  const client = getClient()

  try {
    await client.connect()

    const { rows } = await client.query(sql)

    if (rows == null) {
      return []
    }
    return rows
  } finally {
    await client.end()
  }
}

async function init() {
  await executeStatement(`
    DROP SCHEMA IF EXISTS ${escapeId('vtb')} CASCADE;
  `)
  await executeStatement(`
    CREATE SCHEMA ${escapeId('vtb')};
  `)

  await executeStatement(`
    CREATE TABLE ${escapeId('vtb')}.${escapeId('users')} (
      ${escapeId('id')} UUID PRIMARY KEY,
      ${escapeId('createdAt')} BIGINT,
      ${escapeId('username')} TEXT,
      ${escapeId('hash')} TEXT,
      ${escapeId('salt')} TEXT
    );
  `)
}
async function show() {
  console.log('Users:')
  console.log(
    await executeStatement(`
      SELECT * FROM ${escapeId('vtb')}.${escapeId('users')};
    `),
  )
}

async function createUser({ id, createdAt, username, hash, salt }) {
  await executeStatement(`
    INSERT INTO  ${escapeId('vtb')}.${escapeId('users')} (
      ${escapeId('id')}, 
      ${escapeId('createdAt')}, 
      ${escapeId('username')}, 
      ${escapeId('hash')}, 
      ${escapeId('salt')}
    ) VALUES (
      ${escapeStr(id)},
      ${createdAt},
      ${escapeStr(username)},
      ${escapeStr(hash)},
      ${escapeStr(salt)}
    );
  `)
}

async function findUser(username) {
  const rows = await executeStatement(`
    SELECT * FROM ${escapeId('vtb')}.${escapeId('users')} 
    WHERE ${escapeId('username')} = ${escapeStr(username)}
    LIMIT 1;
  `)

  if (rows.length === 0) {
    return null
  }

  return {
    id: rows[0].id,
    createdAt: +rows[0].createdAt,
    username: rows[0].username,
    hash: rows[0].hash,
    salt: rows[0].salt,
  }
}

module.exports = {
  createUser,
  findUser,
  init,
  show,
  escapeStr,
  escapeId,
  executeStatement,
}