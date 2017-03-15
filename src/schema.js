import { makeExecutableSchema } from 'graphql-tools'

const typeDefs = `
  type Query {
    helloWorld: String!
  }

  schema {
    query: Query
  }
`

const resolvers = {
  Query: {
    helloWorld: () => 'Hello!'
  }
}

export const schema = makeExecutableSchema({ typeDefs, resolvers })
