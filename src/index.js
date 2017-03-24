import { client } from './client'
import gql from 'graphql-tag'

const query = gql`
  query Post ($id: Int!) {
    post (id: $id) {
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
client.query({ query, variables: { id: 1 } }).then(console.log)
