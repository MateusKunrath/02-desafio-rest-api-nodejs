import fastify from 'fastify'
import cookies from '@fastify/cookie'
import { usersRoutes } from './routes/users.routes'
import { mealsRoutes } from './routes/meals.routes'

export const app = fastify()

app.register(cookies)
app.register(usersRoutes, { prefix: '/users' })
app.register(mealsRoutes, { prefix: '/meals' })
