import { makeExecutableSchema } from 'graphql-tools'

const typeDefs = `
  type Post {
    id: Int!
    title: String
    body: String
    author: User
  }

  type User {
    id: Int!
    username: String
    email: String
    posts: [Post]
  }

  type Query {
    posts: [Post]
    post (id: Int!): Post
    users: [User]
    user: User
  }

  type Mutation {
    addPost(title: String!, body: String!, userId: Int!): Post!
  }

  schema {
    query: Query
    mutation: Mutation
  }
`

const endpoint = 'https://jsonplaceholder.typicode.com'
const toJSON = res => res.json()

const post = (root, { id }) => fetch(`${endpoint}/posts/${id}`).then(toJSON)
const posts = () => fetch(`${endpoint}/posts`).then(toJSON)

const user = (root, { id }) => fetch(`${endpoint}/users/${id}`).then(toJSON)
const users = () => fetch(`${endpoint}/users`).then(toJSON)

const author = ({ userId }) => fetch(`${endpoint}/users/${userId}`).then(toJSON)
const userPosts = ({ id }) => fetch(`${endpoint}/users/${id}/posts`).then(toJSON)

const addPost = (root, post) => fetch(`${endpoint}/posts`, { method: 'POST', body: post })
  .then(toJSON).then(({ id }) => ({ id, ...post }))

const resolvers = {
  Query: {
    post,
    posts,
    user,
    users,
  },
  Mutation: {
    addPost,
  },
  Post: {
    author,
  },
  User: {
    posts: userPosts,
  }
}

export const schema = makeExecutableSchema({ typeDefs, resolvers })
