import ApolloClient, { printAST } from 'apollo-client'
import { graphql } from 'graphql'
import { schema } from './schema'

export const client = new ApolloClient({
  networkInterface: {
    query: req => {
      const query = printAST(req.query)
      const { operationName, variables = {} } = req

      return graphql(schema, query, null, null, variables, operationName)
    }
  }
})
