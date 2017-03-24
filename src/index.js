import { graphql } from 'graphql'
import { schema } from './schema'

const query = `
  mutation {
    addPost(userId: 1, title: "Meu post", body: "Meu texto!") {
      id
      body
      title
    }
  }
`

// Prints
// {
//   "data": {
//     "post": {
//       "id": n,
//       "title": "...",
//       "body": "..."
//     }
//   }
// }
graphql(schema, query).then(console.log)
