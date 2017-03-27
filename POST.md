# GraphQL today using Apollo for applications that still depend on REST APIs

Even though people using GraphQL are often extremely excited about the technology, it's popularity is [still growing slowly](https://trends.google.com/trends/explore?date=2014-03-14%202017-03-14&q=GraphQL). Developers working on client-side applications are the ones to benefit the most from GraphQL, but migrating a backend from a working REST API might not be economically justifiable for most teams. What most don't realize, though, is that it is not completely necessary to make the switch on both sides before adopting the technology. The main [JavaScript implementation](https://github.com/graphql/graphql-js) of a GraphQL server runs just fine on the browser, and [Apollo](http://www.apollodata.com/) makes it easy as cake to start using it today.

> If you plan to use Relay to achieve the same goal, you should definitely check [this post](http://graphql.org/blog/rest-api-graphql-wrapper/) on the official GraphQL blog.

## Who/what is Apollo?

GraphQL is ultimately only a protocol, meaning there are [dozens of projects](https://github.com/chentsulin/awesome-graphql) for both client and server side implementations of it. [Apollo](http://www.apollodata.com/), in the other hand, is a suite of open-source tools & products built by (*very nice folks at*) the [Meteor Development Group](https://jobs.lever.co/meteor).

Among these projects, there is [graphql-tools](https://github.com/apollographql/graphql-tools), which facilitates the creation of a executable schema, and [apollo-client](https://github.com/apollographql/apollo-client), which presents itself as "*The fully-featured, production ready caching GraphQL client for every server or UI framework*". Quite bold, huh?

## Resolving GraphQL in the browser

The first problem to be solved here is how to run a GraphQL server/resolver in the client-side. To be honest, it is not much of a problem really. As I said before, the main JavaScript implementation of GraphQL works in the browser, and all we have to do is use it as we would in a Node server. So let's go on with it.

### Installation

We are going to need two schema building tools:

```sh
yarn add --save graphql graphql-tools
```

> Missing NPM in the command? You should definitely give [Yarn](https://yarnpkg.com/pt-BR/) a try ;)

### Building the GraphQL Schema

First things first. Building a schema is rather easy with [graphql-tools](https://github.com/apollographql/graphql-tools). You start by defining a schema using the [GraphQL schema language](http://graphql.org/learn/schema/#type-language) as follows:

```js
const typeDefs = `
  type Query {
    helloWorld: String!
  }

  schema {
    query: Query
  }
`
```

What we are saying here is that our schema has a single type called *Query* and that this is the root query type, meaning it's fields are queryable at the top level of the schema - in this case, the `helloWorld` field, which resolves to a string.

Then you define resolvers as a nested object that maps type and field names to resolver functions:

```js
const resolvers = {
  Query: {
    helloWorld: () => 'Hello!'
  }
}
```

> More info on `graphql-tools` resolver maps can be found on [this guide](http://dev.apollodata.com/tools/graphql-tools/resolvers.html).

Finally, you combine the type definitions and the resolvers into an *executable schema* using `makeExecutableSchema` helper:

```js
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

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})
```

> Apollo has a documentation section on [modularizing the schema](http://dev.apollodata.com/tools/graphql-tools/generate-schema.html#modularizing), and I've also worked on the subject and created a project which might be useful, though it is in early stages: [graphql-modules](https://github.com/lucasconstantino/graphql-modules). During this tutorial, though, we'll have only one file to keep things simple.

### Executing queries

After we've managed to create an executable schema, we can resolve queries against it using the official *graphql-js* project as follows:

```js
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
```

Done! We can resolve GraphQL. The code so far can be bundled using [webpack](https://webpack.github.io/) or whatever tool you use to build your code to be executed in the browser, and it will work just fine, printing what is supposed to be printed to your console.

> I've created a repository to serve as code reference for this post. It's [available on GitHub](https://github.com/lucasconstantino/graphql-apollo-rest-wrap), it has a ready to use building system and node server for you to try the code presented here. Checkout the tag *[1-hello-world](https://github.com/lucasconstantino/graphql-apollo-rest-wrap/tree/1-hello-world)* to see this check point.

### Resolving using REST API calls

Now that you have a way to resolve GraphQL queries in the browser, we can move forward and add a more advanced schema, with resolvers that map to REST requests.

To keep up with simplicity, I'll use an online fake REST API called [JSONPlaceholder](https://jsonplaceholder.typicode.com/). It has a rough blog schema, with posts, users, comments, etc, which is just perfect for our use case.

First of all, let's update our schema to define these new types:

```js
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
    posts: [Post]
    post (id: Int!): Post
    users: [User]
    user: User
  }

  schema {
    query: Query
  }
`
```

Now, we'll update the resolver map as follows:

```js
const endpoint = 'https://jsonplaceholder.typicode.com'
const toJSON = res => res.json()

const post = (root, { id }) => fetch(`${endpoint}/posts/${id}`).then(toJSON)
const posts = () => fetch(`${endpoint}/posts`).then(toJSON)

const user = (root, { id }) => fetch(`${endpoint}/users/${id}`).then(toJSON)
const users = () => fetch(`${endpoint}/users`).then(toJSON)

const resolvers = {
  Query: {
    post,
    posts,
    user,
    users,
  },
}
```

Note that to fetch REST endpoints we are using [Fetch API](https://developer.mozilla.org/pt-BR/docs/Web/API/Fetch_API). You can polyfill it if you need with [whatwg-fetch](https://github.com/github/fetch), but it is already [available on all major browsers](http://caniuse.com/#feat=fetch).

No we can query posts:

```js
import { graphql } from 'graphql'
import { schema } from './schema'

const query = '{ posts { id, title, body } }'

// Prints
// {
//   data: { posts: [...] }
// }
graphql(schema, query).then(console.log)
```

> Checkpoint: checkout to tag *[2-rest-resolvers](https://github.com/lucasconstantino/graphql-apollo-rest-wrap/tree/2-rest-resolvers)* on the code reference repo to try this out on your browser.

Ok, that's pretty cool. What if we wanted to get a single post from the API, though? Well, easy enough. Here is how we could make a query for the post with id 1:

```js
const query = `
  {
    post (id: 1) {
      id
      title
      body
    }
  }
`
```

Now, having a look at our [mocked API](https://jsonplaceholder.typicode.com/posts/) for posts, we can see that it returns yet a fourth property on each post object: the `userId`. That's a good time for...

### Resolving relations

Relations in GraphQL are simply more resolvers, as I expect you already know. Follow up as we add the Post's author field to the schema, as well as the User's posts field, together with their resolvers:

```diff
 import { makeExecutableSchema } from 'graphql-tools'

 const typeDefs = `
   type Post {
     id: Int!
     title: String
     body: String
+    author: User
   }

   type User {
     id: Int!
     username: String
     email: String
+    posts: [Post]
   }

   type Query {
     posts: [Post]
     post (id: Int!): Post
     users: [User]
     user: User
   }

   schema {
     query: Query
   }
 `

 const endpoint = 'https://jsonplaceholder.typicode.com'
 const toJSON = res => res.json()

 const post = (root, { id }) => fetch(`${endpoint}/posts/${id}`).then(toJSON)
 const posts = () => fetch(`${endpoint}/posts`).then(toJSON)

 const user = (root, { id }) => fetch(`${endpoint}/users/${id}`).then(toJSON)
 const users = () => fetch(`${endpoint}/users`).then(toJSON)

+const author = ({ userId }) => fetch(`${endpoint}/users/${userId}`).then(toJSON)
+const userPosts = ({ id }) => fetch(`${endpoint}/users/${id}/posts`).then(toJSON)
+
 const resolvers = {
   Query: {
     post,
     posts,
     user,
     users,
   },
+  Post: {
+    author,
+  },
+  User: {
+    posts: userPosts,
+  }
 }

 export const schema = makeExecutableSchema({ typeDefs, resolvers })
```

> To remember what function parameters we are using this relation resolvers, have a look at the [resolver function signature](http://dev.apollodata.com/tools/graphql-tools/resolvers.html#Resolver-function-signature).

Ok, things are becoming really interesting. Now we can make GraphQL work it's magic, doing crazy stuff such as "*grabbing the posts with the same author as post 1*":

```js
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
```

Oooh, that's truly amazing! I'll just take break for a coffee and contemplate such good work we've accomplished so far...

> Meanwhile, another checkpoint for you to run: *[3-relationship-resolvers](https://github.com/lucasconstantino/graphql-apollo-rest-wrap/tree/3-relationship-resolvers)*.

### Now, mutations!

Mutations in GraphQL are just more field resolvers, only with some additional behavior. Having that said, to create `addPost` mutation we will basically create a resolver that fetches using the HTTP method `POST` as follows:

```diff
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

+  type Mutation {
+    addPost(title: String!, body: String!, userId: Int!): Post!
+  }
+
   schema {
     query: Query
+    mutation: Mutation
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

+const addPost = (root, post) => fetch(`${endpoint}/posts`, { method: 'POST', body: post })
+  .then(toJSON).then(({ id }) => ({ id, ...post }))
+
 const resolvers = {
   Query: {
     post,
     posts,
     user,
     users,
   },
+  Mutation: {
+    addPost,
+  },
   Post: {
     author,
   },
   User: {
     posts: userPosts,
   }
 }

 export const schema = makeExecutableSchema({ typeDefs, resolvers })
```

> Side note about the code above: our mocked API accepts `POST` requests, but returns only the supposedly generated id in the response, nothing more.

Our mutation queries then have to be identified as such:

```js
const query = `
  mutation {
    addPost(userId: 1, title: "Meu post", body: "Meu texto!") {
      id
      body
      title
    }
  }
`
```

> One more checkpoint and we're done: *[4-mutation-resolvers](https://github.com/lucasconstantino/graphql-apollo-rest-wrap/tree/4-mutation-resolvers)*.

## Apollo Client

Ok, I know that running a static query stored in a variable in the *index.js* of our application isn't going to be enough for long. The next step is integrating what we already have with [Apollo Client](https://github.com/apollographql/apollo-client) ("*The fully-featured, production ready caching GraphQL client for every server or UI framework*". Again: long description, not modest, but quite accurate).

### Installation

```sh
yarn add apollo-client graphql-tag
```

### Creating the client

To create an Apollo Client instance you must instantiate the ApolloClient class with a configuration object containing, at least, the *network interface* which the client will use to make GraphQL requests. Usually, in a front-end/back-end application this means using the included helper *createNetworkInterface*, which would basically send POST requests to a backend on the same domain of the running application. It looks pretty much like this:

```js
import ApolloClient, { createNetworkInterface } from 'apollo-client'

export const client = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: 'https://graphql.example.com',
  }),
})
```

And, to perform a query, something like this:

```js
const query = gql`
  query {
    helloWorld
  }
`

client.query({ query }).then(console.log)
```

> If you are interested, you can find out more on the [Network layer](http://dev.apollodata.com/core/network.html) of the Apollo Client.

The code above would be just fine provided we had a backend serving GraphQL - which we don't. Good enough we've being building our own wrap around the REST API just earlier in this post. What we now have to do is make ApolloClient use the GraphQL schema and resolver as were we doing before:

```js
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
```

Ok, what the heck is going on here?

First, we are instantiating ApolloClient with a completely custom *networkInterface*. It consists of an object with the single required method *query*, which will be called by the client to resolve queries. This method will receive a single argument; an ApolloClient [Request Interface](https://github.com/apollographql/apollo-client/blob/master/src/transport/networkInterface.ts#L32).

Second, we use an available helper, `printAST`, to process this request object back into a valid GraphQL query string (much similar to the ones we were statically using before).

Third, we extract other import things from this request object, such as an [`operationName`](http://graphql.org/learn/queries/#operation-name) and possible [`variables`](http://graphql.org/learn/queries/#variables) to provide the resolver with.

Last but not least, we run the query against the schema as have we done before, providing it with the schema, the query, the initial root, a context (null here, for we don't need it yet), the variables, and the operation name, in that exact arguments order. Most of the arguments are not mandatory, as we've seen this same function be executed with only the first two just a few words back in this post.

<img src="https://m.popkey.co/5ea88b/LlVA6.gif" width="100%" />

> If you have any question about the query execution part, have a look at GraphQL's official documentation on [query execution](http://graphql.org/learn/execution/).

We can now use the client as we normally would:

```js
import { client } from './client'
import gql from 'graphql-tag'

const query = gql`
  query Post ($id: Int!) {
    post (id: $id) {
      id
      title
      body
      author {
        id
        username
        email
      }
    }
  }
`

client.query({ query, variables: { id: 1 } }).then(console.log)
```

> Time for the final checkpoint: *[5-apollo-client](https://github.com/lucasconstantino/graphql-apollo-rest-wrap/tree/5-apollo-client)*.

## Conclusion

This is pretty much it. I hope you all found your way in this wandering of GraphQL learning, and above all, I hope you are now able to start using GraphQL today, no more excuses allowed.

#### Post credit scene

Ok, if you are really just starting with GraphQL you might not even know what to do with this *ApolloClient* we've ended up with. Our *index.js* is still just resolving a single query. My bad. I understand that if you are here, you probably do already use React, Angular, or even Vue (but only if you are a true hipster). If that's the case, here are the libraries you are looking for:

- https://github.com/apollographql/react-apollo
- https://github.com/apollographql/apollo-angular
- https://github.com/Akryum/vue-apollo

See ya!
