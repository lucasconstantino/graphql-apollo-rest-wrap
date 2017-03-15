import { graphql } from 'graphql'
import { schema } from './schema'

const query = '{ helloWorld }'

graphql(schema, query).then(result => {
  // Prints
  // {
  //   data: { helloWorld: "Hello!" }
  // }
  console.log(result)
})
