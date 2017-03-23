import { graphql } from 'graphql'
import { schema } from './schema'

const query = `
  {
    post (id: 1) {
      id
      author {
        id
        posts {
          id
          title
          body
        }
      }
    }
  }
`

// Prints
// {
//   "data": {
//     "post": {
//       "id": 1,
//       "author": {
//         "id": 1,
//         "posts": [...]
//       }
//     }
//   }
// }
graphql(schema, query).then(console.log)
