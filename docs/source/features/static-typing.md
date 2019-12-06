---
title: Static Typing
---

As your application grows, you may find it helpful to include a type system to
assist in development. Apollo supports type definitions for TypeScript system.
Both `@apollo/client/common` and `apollo-angular` ship with definitions in their npm
packages, so installation should be done for you after the libraries are
included in your project.

## Operation result

The most common need when using type systems with GraphQL is to type the results
of an operation. Given that a GraphQL server's schema is strongly typed, we can
even generate TypeScript definitions automaticaly using a tool like
[Graphql Code Generator](https://graphql-code-generator.com/docs/plugins/typescript-apollo-angular). In these docs
however, we will be writing result types manually.

Since the result of a query will be sent to the component or service, we want to
be able to tell our type system the shape of it. Here is an example setting
types for an operation using TypeScript:

```ts
import { Apollo } from 'apollo-angular';
import gql from '@apollo/client/common';

const HERO_QUERY = gql`
  query GetCharacter($episode: Episode!) {
    hero(episode: $episode) {
      name
      id
      friends {
        name
        id
        appearsIn
      }
    }
  }
`;

type Hero = {
  name: string;
  id: string;
  appearsIn: string[];
  friends: Hero[];
};

type Response = {
  hero: Hero;
};

@Component({ ... })
class AppComponent {
  response
  constructor(apollo: Apollo) {
    apollo.watchQuery<Response>({
      query: HERO_QUERY,
      variables: { episode: 'JEDI' }
    })
      .valueChanges
      .subscribe(result => {
        console.log(result.data.hero); // no TypeScript errors
      });
  }
}
```

Without specyfing a Generic Type for `Apollo.watchQuery`, TypeScript would throw
an error saying that `hero` property does not exist in `result.data` object (it
is an `Object` by default).

## Options

To make integration between Apollo and Angular even more statically typed you
can define the shape of variables (in query, watchQuery and mutate methods).
Here is an example setting the type of variables:

```javascript
import { Apollo } from 'apollo-angular';
import { gql } from '@apollo/client/common';

const HERO_QUERY = gql`
  query GetCharacter($episode: Episode!) {
    hero(episode: $episode) {
      name
      id
      friends {
        name
        id
        appearsIn
      }
    }
  }
`;

type Hero = {
  name: string;
  id: string;
  appearsIn: string[];
  friends: Hero[];
};

type Response = {
  hero: Hero;
};

type Variables = {
  episode: string
};

@Component({ ... })
class AppComponent {
  constructor(apollo: Apollo) {
    apollo.watchQuery<Response, Variables>({
      query: HERO_QUERY,
      variables: { episode: 'JEDI' } // controlled by TypeScript
    })
      .valueChanges
      .subscribe(result => {
        console.log(result.data.hero);
      });
  }
}
```

With this addition, the entirety of the integration between Apollo and Angular
can be statically typed. When combined with the strong tooling each system
provides, it can make for a much improved application and developer experience.

## Other usage

It is not only `Apollo` service where you can use generic types for Options and
Variables. Same logic applies to `QueryRef` object.

```ts
import { QueryRef } from 'apollo-angular';

type Hero = {
  name: string;
  id: string;
  appearsIn: string[];
  friends: Hero[];
};

type Response = {
  hero: Hero;
};

type Variables = {
  episode: string
};

@Component({ ... })
class AppComponent {
  heroQuery: QueryRef<Response, Variables>;

  changeEpisode(episode: string) {
    this.heroQuery.setVariables({
      episode: 'JEDI'
    });
  }
}
```
