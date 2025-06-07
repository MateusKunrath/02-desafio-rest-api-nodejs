import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'
import { app } from '../src/app'
import request from 'supertest'
import { knex } from '../src/database'

describe('Users routes', () => {
  beforeAll(async () => {
    await app.ready()
    execSync('npm run knex migrate:latest')
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await knex('meals').delete()
    await knex('users').delete()
    await knex.raw('DELETE FROM sqlite_sequence WHERE name="meals"')
    await knex.raw('DELETE FROM sqlite_sequence WHERE name="users"')
    // try {
    //   execSync('npm run knex migrate:rollback --all', { stdio: 'ignore' })
    // } catch (err) {
    //   // Não existiam tabelas
    //   console.warn('Não existia estrutura para dar rollback')
    // }
    // execSync('npm run knex migrate:latest')
  })

  it('should be able to create a user', async () => {
    const response = await request(app.server).post('/users').send({
      name: 'User test',
      email: 'user@test.com',
    })

    expect(response.statusCode).toBe(201)

    const cookies = response.get('Set-Cookie')

    expect(cookies).toEqual(
      expect.arrayContaining([expect.stringContaining('sessionId')]),
    )
  })
})
