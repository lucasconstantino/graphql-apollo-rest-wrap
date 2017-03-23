import { makeExecutableSchema } from 'graphql-tools'

const typeDefs = `
  type Post {
    id: Int!
    title: String
    body: String
  }

  type User {
    id: Int!
    username: String
    email: String
  }

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
