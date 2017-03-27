# GraphQL hoje usando Apollo em aplicações que ainda dependem de APIs REST

Apesar do entusiamo das pessoas que já estão usando GraphQL, a popularidade da ferramenta está [crescendo a passos curtos](https://trends.google.com/trends/explore?date=2014-03-14%202017-03-14&q=GraphQL). Desenvolvedores trabalhando no client-side das aplicações são os que mais rapidamente têm a ganhar com o GraphQL, mas poucos ainda conseguem justificar o investimento financeiro na migração de um backend em pleno funcionamento servindo uma API REST. O que poucos percebem, porém, é que não é preciso fazer a migração simultaneamente no servidor antes de começar a usar a tecnologia no client-side. A [implementação de referência](https://github.com/graphql/graphql-js) para servidores GraphQL é escrita em JavaScript, roda muito bem em navegadores, e é ainda mais fácil de usar quando combinada com as ferramentas fornecidas pelo [Apollo](http://www.apollodata.com/).

> Se você prefere Relay, deveria ler [esse post](http://graphql.org/blog/rest-api-graphql-wrapper/) no blog oficial do GraphQL.

## O que é Apollo?

O GraphQL é, fundamentalmente, apenas um protocolo de comunicação, e portanto existem [dezenas de projetos em várias linguagens](https://github.com/chentsulin/awesome-graphql), tanto pra client-side quanto pra server-side. Já o [Apollo](http://www.apollodata.com/) é um conjunto de ferramentas e produtos criados pelo [time de desenvolvimento do Meteor](https://jobs.lever.co/meteor) para trabalhar com GraphQl.

Dentre esses projetos, há o [graphql-tools](https://github.com/apollographql/graphql-tools), que visa facilitar a criação de schemas executáveis, e o [apollo-client](https://github.com/apollographql/apollo-client), que se auto-determina "*O cliente GraphQL totalmente preparado para produção e para qualquer servidor ou framework UI*". Ousado, não?

## Resolvendo GraphQL queries no navegador

O primeiro problema a ser resolvido é como executar GraphQL resolvers no client-side. Sinceramente, não é muito difícil. Como mencionei anteriormente, o `graphql-js` funciona muito bem no ambiente de um navegador, e basta usá-la como faríamos num servidor Node.

### Instalação

Vamos precisar inicialmente de duas ferramentas para construir nosso schema:

```sh
yarn add --save graphql graphql-tools
```

> Sentido falta do NPM no comando acima? Sugiro que você dẽ uma olhada no [Yarn](https://yarnpkg.com/pt-BR/) ;)

### Construindo o GraphQL Schema

Vamos começar pelo início (!). Construir um schema é simples, usando o [graphql-tools](https://github.com/apollographql/graphql-tools). Começamos por definir um schema usando a [linguagem de schema do GraphQL](http://graphql.org/learn/schema/#type-language), como segue:

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

O que estamos dizendo aqui é que nosso schema tem um único typo, chamado *Query*, e que esse tipo é o "tipo raíz". Isso significa que os campos desse tipo são pesquisáveis no primeiro nível do schema - neste caso, o campo `helloWorld`, que é resolvido a uma string.

Em seguida definimos os resolvers através de um objeto que serve de mapa de resolução (*resolver map*) para os campos de cada tipo declarado no schema:

```js
const resolvers = {
  Query: {
    helloWorld: () => 'Hello!'
  }
}
```

> Veja mais informações sobre *resolver maps* [neste guia](http://dev.apollodata.com/tools/graphql-tools/resolvers.html).

Por fim, combinamos a definição do schema com os resolvers usando o método `makeExecutableSchema`, criando assim um schema executável:

```js
import { makeExecutableSchema } from 'graphql-tools'

const schema = makeExecutableSchema({ typeDefs, resolvers })
```

Para manter a simplicidade, por hora vamos manter todo o código num mesmo arquivo, chamado `schema.js`, que, portanto, conterá o seguinte:

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

> Há uma mençao extensa sobre [modularização do schema](http://dev.apollodata.com/tools/graphql-tools/generate-schema.html#modularizing) na documentação do Apollo. Eu mesmo tenho um projeto sobre este assunto, apesar de ele ser ainda bastante inicial: [graphql-modules](https://github.com/lucasconstantino/graphql-modules). Durante esse tutorial, porém, vamos manter apenas um arquivo para o schema a fim de simplificar as coisas.

### Executing queries

Agora que temos um schema executável, podemos resolver queries usando o *graphql-js* da seguinte forma:

```js
import { graphql } from 'graphql'
import { schema } from './schema'

const query = '{ helloWorld }'

graphql(schema, query).then(result => {
  // Exibe no console:
  // {
  //   data: { helloWorld: "Hello!" }
  // }
  console.log(result)
})
```

Perfeito! Conseguimos resolver queries de GraphQL. O código até aqui pode ser empacotado usando [webpack](https://webpack.github.io/) ou qualquer outra ferramenta de empacotamento, e então executado no navegador, imprimindo o resultado no console.

> Criei um repositorio para servir de código de referência para este post. Ele está [disponível no GitHub](https://github.com/lucasconstantino/graphql-apollo-rest-wrap), e já conta com um sistema de empacotamento pré-configurado para facilitar seus testes. Baixe o projeto usando git e acesse a tag *[1-hello-world](https://github.com/lucasconstantino/graphql-apollo-rest-wrap/tree/1-hello-world)* para ver o código até este momento.

### Usando REST nos resolvers

Agora que temos uma forma de executar queries de GraphQL no navegador, podemos seguir adiante e adicionar um schema mais realista, com resolvers que realização requisições REST.

Para fins de simplicar as coisas, vamos usar uma API REST para testes chamada [JSONPlaceholder](https://jsonplaceholder.typicode.com/). Não é preciso instalá-la, está (quase) sempre disponível, e tem um schema básico de um blog, com posts, usuários, comentários, etc; exatamente o que precisamos pra fazer alguns testes com GraphQL.

Primeiro, vamos atualizar nosso schema pra adicionar os novos tipos:

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

Agora, atualizaremos os resolvers da seguinte forma:

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

Note que utilizamos a [Fetch API](https://developer.mozilla.org/pt-BR/docs/Web/API/Fetch_API), já disponível nos [principais navegadores](http://caniuse.com/#feat=fetch). Se for preciso, você pode instalar o polyfill [whatwg-fetch](https://github.com/github/fetch) para navegadores antigos.

Agora podemos consultar posts:

```js
import { graphql } from 'graphql'
import { schema } from './schema'

const query = '{ posts { id, title, body } }'

// Exibe no console:
// {
//   data: { posts: [...] }
// }
graphql(schema, query).then(console.log)
```

> Checkpoint: *[2-rest-resolvers](https://github.com/lucasconstantino/graphql-apollo-rest-wrap/tree/2-rest-resolvers)*

Ok, isso parece legal. E se quiséssemos retornar apenas um post dessa API? Fácil. Segue uma query pelo post de id igual a 1:

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

Agora, analisando o [endpoint de posts na API de testes](https://jsonplaceholder.typicode.com/posts/) vemos que ela retorna um quarto campo em cada post: o `userId`. é chegada a hora para...

### Resolvendo relacionamentos

Relacionamentos são a beleza do GraphQL mas, apesar da sua importância, fundamentalmente são apenas campos comuns. Vamos seguir adiante e adicionar o campo *author* no tipo *Post* e o campo *posts* no tipo *User*, junto dos seus resolvers:

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

> Refrescando a memória: de uma olhada na documentação das
[*resolver functions*](http://dev.apollodata.com/tools/graphql-tools/resolvers.html#Resolver-function-signature) para entender os argumentos que estamos usando no código acima.

Agora as coisas estão ficando interessantes. Agora podemos deixar que o GraphQL faça sua mágica, fazendo coisas como "*pegar todos os posts cujo autor é o autor do post 1*"

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

A, isso é fantástico! Uma pausa para o café...

> Enquanto isso, outro checkpoint pra você testar: *[3-relationship-resolvers](https://github.com/lucasconstantino/graphql-apollo-rest-wrap/tree/3-relationship-resolvers)*.

###  E agora, mutações!

Mutações no GraphQL são apenas mais resolvers de campos, somente com alguns comportamentos divergentes, como o fato de serem resolvidos em serie, e não em paralelo, como as queries. Criar uma mutação `addPost`, por exemplo, será nada mais do que criar um resolver que realiza uma requisição `POST`, como vemos a seguir:

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

> Um parêntese sobre o código acima: a nossa API de testes até aceita requisições `POST`, mas retorna como resultado apenas o id supostamente gerado. Na verdade, nenhum dado é persistido.

Uma query de mutação, então, deve ser identificada da seguinte forma:

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

> Mais um checkpoint: *[4-mutation-resolvers](https://github.com/lucasconstantino/graphql-apollo-rest-wrap/tree/4-mutation-resolvers)*.

## Apollo Client

Ok, entendo que executar queries estáticas se provou fácil, mas nossa aplicação precisará de mais. O próximo passo é integrar o que temos ao [Apollo Client](https://github.com/apollographql/apollo-client).

## Instalação

```sh
yarn add apollo-client graphql-tag
```

### Criando o client

Para criar um cliente Apollo, precisamos instanciar a classe `ApolloClient`. Ela recebe como argumento um objeto que contenha, pelo menos, um *network interface* - interface de rede - que será utilizado pelo cliente para efetuar as requisições GraphQL. Normalmente, quando numa aplicação com GraphQL em ambos client-side e server-side, criamos um *network interface* usando o helper *createNetworkInterface*, que basicamente cria uma interface de rede para realizar requisições `POST` contra um backend servido no mesmo domínio da aplicação em execução. Seria algo assim:

```js
import ApolloClient, { createNetworkInterface } from 'apollo-client'

export const client = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: 'https://graphql.example.com',
  }),
})
```

E, para executar uma query, faríamos:

```js
const query = gql`
  query {
    helloWorld
  }
`

client.query({ query }).then(console.log)
```

> Se tiver interesse, leia mais sobre a [camada de network](http://dev.apollodata.com/core/network.html) do Apollo Client.

Aqui, porém, não temos GraphQL no backend, e portanto vamos criar uma interface de rede personalizada para resolver as queries diretamente no navegador, usando o schema e os resolvers criados anteriorment. Não é algo simples, veja só:

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

Céus, o que está acontecendo aqui?

Priemrio, instanciamos o ApolloClient passando nosso *networkInterface* personalizado. Ele consiste de um objeto com o método *query* disponível. Esse método será chamado toda vez que uma query for ser resolvida. O método recebe um único argumento: um objeto do tipo [Request Interface](https://github.com/apollographql/apollo-client/blob/master/src/transport/networkInterface.ts#L32).

Segundo, usamos um helper disponibilizado pelo próprio *apollo-client* para processar o objeto de requisição e criar uma query GraphQL válida, em texto, similar as que estavamos definindo antes de forma estática.

Terceiro, extraímos outras informações importantes da requisição: [`operationName`](http://graphql.org/learn/queries/#operation-name), que é o nome (opcionalmente) dado á operação; e possíveis [`variables`](http://graphql.org/learn/queries/#variables) que seriam fornecidas junto da query.

Por último, executamos a query contra o schema, fornecendo também um root inicial e um contexto (ambos nulos aqui, já que não precisamos deles ainda), as variáveis, e o nome da operação. A maioria dos argumentos aqui é opcional.

<img src="https://m.popkey.co/5ea88b/LlVA6.gif" width="100%" />

> Se tiver dúvidas sobre esse último passo, dê uma olhada na documentação oficial sobre [execução de queries](http://graphql.org/learn/execution/).


Agora podemos usar nosso client como normalmente faríamos:

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

> Último checkpoint: *[5-apollo-client](https://github.com/lucasconstantino/graphql-apollo-rest-wrap/tree/5-apollo-client)*.

## Conclusão

Isso é tudo. Espero que vocês tenham apreciado nosso devaneio no aprendizado de GraphQl e, sobretudo, espero que vocês agora sejam capazes de começar a usar GraphQL, sem mais desculpas envolvendo o pessoal do backend estar com preguiça de preparar um servidor pra você.

### Cena após os créditos:

Se você está realmente só começando com GraphQL talvez você nem saiba como/onde usar esse cliente que acabamos de criar. Peço desculpas. Bom, eu imagino que se você está aqui é provável que já use React, Angular, ou mesmo Vue (se for um desenvolvedor hispter incompreendido). Se for esse o caso, tem algumas bibliotecas que vão te ajudar a seguir em frente, conectando o client Apollo ao seu framework favorito:

- https://github.com/apollographql/react-apollo
- https://github.com/apollographql/apollo-angular
- https://github.com/Akryum/vue-apollo

Até mais!
