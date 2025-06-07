import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'
import { app } from '../src/app'
import request from 'supertest'
import { knex } from '../src/database'

describe('Meals routes', () => {
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
  })

  it('should be able to create a new meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({ name: 'User test', email: 'usertest@test.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', createUserResponse.get('Set-Cookie')!)
      .send({
        name: 'Meal test',
        description: 'Meal description test',
        isOnDiet: true,
        date: new Date(),
      })
      .expect(201)
  })

  it('should be able to list all user meals', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({ name: 'User test', email: 'usertest@test.com' })

    const cookie = createUserResponse.get('Set-Cookie')!

    const date = new Date()

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Lunch',
      description: 'Lunch description here',
      isOnDiet: true,
      date,
    })

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Dinner',
        description: 'Dinner description here',
        isOnDiet: true,
        date: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)

    expect(listMealsResponse.statusCode).toBe(200)
    expect(listMealsResponse.body.meals).toHaveLength(2)

    expect(listMealsResponse.body.meals[0].name).toBe('Dinner')
    expect(listMealsResponse.body.meals[1].name).toBe('Lunch')
  })

  it('should be able to get a specific transaction', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({ name: 'User test', email: 'usertest@test.com' })

    const cookie = createUserResponse.get('Set-Cookie')!

    const date = new Date()

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Lunch',
      description: 'Lunch description here',
      isOnDiet: true,
      date,
    })

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Dinner',
        description: 'Dinner description here',
        isOnDiet: true,
        date: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)

    const mealId = listMealsResponse.body.meals[0].id

    const getMealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookie)

    expect(getMealResponse.statusCode).toBe(200)
    expect(getMealResponse.body.meal.name).toBe('Dinner')
  })

  it('should be able to update a user meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({ name: 'User test', email: 'usertest@test.com' })

    const cookie = createUserResponse.get('Set-Cookie')!

    const date = new Date()

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Lunch',
      description: 'Lunch description here',
      isOnDiet: true,
      date,
    })

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Dinner',
        description: 'Dinner description here',
        isOnDiet: true,
        date: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)

    const mealId = listMealsResponse.body.meals[0].id

    const updateMealResponse = await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', cookie)
      .send({
        name: 'Breakfast',
        description: 'Breakfast description here',
        isOnDiet: true,
        date: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      })

    expect(updateMealResponse.statusCode).toBe(204)

    const listUpdatedMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)

    expect(listUpdatedMealsResponse.body.meals[0].name).toEqual('Breakfast')
  })

  it('should be able to delete a user meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({ name: 'User test', email: 'usertest@test.com' })

    const cookie = createUserResponse.get('Set-Cookie')!

    const date = new Date()

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Lunch',
      description: 'Lunch description here',
      isOnDiet: true,
      date,
    })

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Dinner',
        description: 'Dinner description here',
        isOnDiet: true,
        date: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)

    const mealId = listMealsResponse.body.meals[0].id

    const deleteMealResponse = await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', cookie)

    expect(deleteMealResponse.statusCode).toBe(204)

    const listDeletedMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)

    expect(listDeletedMealsResponse.body.meals).toHaveLength(1)
  })

  it('should be able to get user metrics', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({ name: 'User test', email: 'usertest@test.com' })

    const cookie = createUserResponse.get('Set-Cookie')!

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Breakfast',
        description: 'Breakfast description here',
        isOnDiet: true,
        date: new Date('2025-06-07T10:00:00'),
      })

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Lunch',
        description: 'Lunch description here',
        isOnDiet: true,
        date: new Date('2025-06-07T13:00:00'),
      })

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Ice cream',
        description: 'Ice cream description here',
        isOnDiet: false,
        date: new Date('2025-06-07T16:00:00'),
      })

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Snack',
        description: 'Snack description here',
        isOnDiet: true,
        date: new Date('2025-06-07T18:30:00'),
      })

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Dinner',
        description: 'Dinner description here',
        isOnDiet: true,
        date: new Date('2025-06-07T21:00:00'),
      })

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Snack',
        description: 'Snack description here',
        isOnDiet: true,
        date: new Date('2025-06-07T23:15:00'),
      })

    const metricsResponse = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', cookie)

    expect(metricsResponse.statusCode).toBe(200)
    expect(metricsResponse.body).toEqual({
      totalMeals: 6,
      totalMealsOnDiet: 5,
      totalMealsOffDiet: 1,
      bestSequenceOnDiet: 3,
    })
  })
})
