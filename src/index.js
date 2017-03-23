import { graphql } from 'graphql'
import { schema } from './schema'

const query = '{ posts { id, title, body } }'

// Prints
// {
//   data: { posts: Array[100] }
// }
graphql(schema, query).then(console.log)
