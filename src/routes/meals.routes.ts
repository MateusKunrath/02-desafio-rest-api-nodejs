import { FastifyInstance } from 'fastify'
import { checkSessionIdExistsAndDefineUser } from '../middlewares/check-session-id-exists-and-define-user'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/',
    { preHandler: [checkSessionIdExistsAndDefineUser] },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isOnDiet: z.boolean(),
        date: z.coerce.date(),
      })

      const { name, description, isOnDiet, date } = createMealBodySchema.parse(
        request.body,
      )

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        is_on_diet: isOnDiet,
        date: date.getTime(),
        user_id: request.user?.id,
      })

      return reply.status(201).send()
    },
  )

  app.get(
    '/',
    { preHandler: [checkSessionIdExistsAndDefineUser] },
    async (request, reply) => {
      const meals = await knex('meals')
        .where('user_id', request.user?.id)
        .orderBy('date', 'desc')

      return reply.status(200).send({ meals })
    },
  )

  app.get(
    '/:id',
    { preHandler: [checkSessionIdExistsAndDefineUser] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      const meal = await knex('meals')
        .where({ id, user_id: request.user?.id })
        .first()

      return reply.status(200).send({ meal })
    },
  )

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExistsAndDefineUser] },
    async (request, reply) => {
      const updateMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const updateMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isOnDiet: z.boolean(),
        date: z.coerce.date(),
      })

      const { id } = updateMealParamsSchema.parse(request.params)

      const { name, description, isOnDiet, date } = updateMealBodySchema.parse(
        request.body,
      )

      const mealExists = await knex('meals')
        .where({ id, user_id: request.user?.id })
        .first()

      if (!mealExists) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      await knex('meals').where({ id }).update({
        name,
        description,
        is_on_diet: isOnDiet,
        date: date.getTime(),
      })

      return reply.status(204).send()
    },
  )

  app.get(
    '/metrics',
    { preHandler: [checkSessionIdExistsAndDefineUser] },
    async (request, reply) => {
      const totalMealsOnDiet = await knex('meals')
        .where({
          user_id: request.user?.id,
          is_on_diet: true,
        })
        .count('*', { as: 'total' })
        .first()

      const totalMealsOffDiet = await knex('meals')
        .where({
          user_id: request.user?.id,
          is_on_diet: false,
        })
        .count('*', { as: 'total' })
        .first()

      const totalMeals = await knex('meals')
        .where({ user_id: request.user?.id })
        .orderBy('date', 'desc')

      const initialBestSequence = { bestSequence: 0, currentSequence: 0 }

      const { bestSequence } = totalMeals.reduce(
        (acc, { is_on_diet: isOnDiet }) => {
          if (isOnDiet) {
            acc.currentSequence += 1
            acc.bestSequence = Math.max(acc.bestSequence, acc.currentSequence)
          } else {
            acc.currentSequence = 0
          }

          return acc
        },
        initialBestSequence,
      )

      return reply.status(200).send({
        totalMeals: totalMeals.length,
        totalMealsOnDiet: totalMealsOnDiet?.total ?? 0,
        totalMealsOffDiet: totalMealsOffDiet?.total ?? 0,
        bestSequenceOnDiet: bestSequence,
      })
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExistsAndDefineUser] },
    async (request, reply) => {
      const deleteMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = deleteMealParamsSchema.parse(request.params)

      const mealExists = await knex('meals')
        .where({ id, user_id: request.user?.id })
        .first()

      if (!mealExists) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      await knex('meals').where({ id }).delete()

      return reply.status(204).send()
    },
  )
}
