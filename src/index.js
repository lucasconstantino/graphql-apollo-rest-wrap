import { graphql } from 'graphql'
import { schema } from './schema'

const query = `{
  post(id: 1) {
    id
    title
    body
  }
}`

// Prints
// {
//   data: { post: { id: 1, body: '...', title: '...' } }
// }
graphql(schema, query).then(console.log)
