import { makeExecutableSchema } from 'graphql-tools'

const typeDefs = `
  type Query {
  }

  schema {
    query: Query
  }
`

const resolvers = {
  Query: {
  }
}

export const schema = makeExecutableSchema({ typeDefs, resolvers })
