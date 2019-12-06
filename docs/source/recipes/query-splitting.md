---
title: Query Splitting
---

Prefetching is an easy way to make your applications UI feel faster. You can use mouse events to predict the data that could be needed.
This is powerful and works perfectly on the browser, but can not be applied to a mobile device.

One solution for improving the UI experience would be the usage of fragments to preload more data in a query, but loading huge amounts of data (that you probably never show to the user) is expensive.

Another solution would be to split huge queries into two smaller queries:

- The first one could load data which is already in the store. This means that it can be displayed instantly.
- The second query could load data which is not in the store yet and must be fetched from the server first.

This solution gives you the benefit of not fetching too much data, as well as the possibility to show some part of the views data before the server responds.

Lets say you have the following schema:

```graphql
type Series {
  id: Int!
  title: String!
  description: String!
  episodes: [Episode]!
  cover: String!
}

type Episode {
  id: Int!
  title: String!
  cover: String!
}

type Query {
  series: [Series!]!
  oneSeries(id: Int): Series
}
```

And you have two Views:

1. Series Overview: List of all Series with their description and cover
1. Series DetailView: Detail View of a Series with its description, cover and a list of episodes

The query for the Series Overview would look like the following:

```graphql
query seriesOverviewData {
  series {
    id
    title
    description
    cover
  }
}
```

The queries for the Series DetailView would look like this:

```graphql
query seriesDetailData($seriesId: Int!) {
  oneSeries(id: $seriesId) {
    id
    title
    description
    cover
  }
}
```

```graphql
query seriesEpisodes($seriesId: Int!) {
  oneSeries(id: $seriesId) {
    id
    episodes {
      id
      title
      cover
    }
  }
}
```

By adding a [custom resolver](/features/cache-updates/#cache-redirects-with-cacheredirects) for the `oneSeries` field (and having dataIdFromObject function which normalizes the cache), the data can be resolved instantly from the store without a server round trip.

```ts
import { Apollo } from 'apollo-angular';
import { toIdValue } from 'apollo-utilities';
import { InMemoryCache } from '@apollo/client/common';

@NgModule({ ... })
class AppModule {
  constructor(apollo: Apollo) {
    apollo.create({
      link: // your link,
      cache: new InMemoryCache({
        cacheResolvers: {
          Query: {
            oneSeries: (_, { id }) => toIdValue(dataIdFromObject({ __typename: 'Series', id })),
          },
        },
        dataIdFromObject,
      })
    })
  }
}
```

A component for the second view that implements the two queries could look like this:

```ts
import { Apollo } from 'apollo-angular';

const QUERY_SERIES_DETAIL_VIEW = gql`
  query seriesDetailData($seriesId: Int!) {
    oneSeries(id: $seriesId) {
      id
      title
      description
      cover
    }
  }
`

const QUERY_SERIES_EPISODES = gql`
  query seriesEpisodes($seriesId: Int!) {
    oneSeries(id: $seriesId) {
      id
      episodes {
        id
        title
        cover
      }
    }
  }
`;

@Component({
  template: `
    <h1>{{seriesLoading ? 'Loading...' : oneSeries.title}}</h1>
    <img [src]="seriesLoading ? '/dummy.jpg' : oneSeries.cover" />

    <h2>Episodes</h2>

    <ul>
      <li *ngIf="episodesLoading"> Loading...</li>
      <li *ngIf="!episodesLoading">
        <img src={episode.cover} />
        <a href="/episode/{{episode.id}}">{episode.title}</a>
      </li>
    </ul>
  `
})
class AppComponent {
  apollo: Apollo;
  seriesId: number;
  // loading
  seriesLoading: boolean;
  episodesLoading: boolean;
  // data
  oneSeries: any;
  episodes: any[];

  ngOnInit() {
    this.apollo.watchQuery({
      query: QUERY_SERIES_DETAIL_VIEW
      variables: { seriesId: this.seriesId }
    })
      .valueChanges
      .subscribe(({loading, data}) => {
        this.seriesLoading = loading;
        this.oneSeries = data.oneSeries;
      });

    this.apollo.watchQuery({
      query: QUERY_SERIES_EPISODES
      variables: { seriesId: this.seriesId }
    })
      .valueChanges
      .subscribe(({loading, data}) => {
        this.episodesLoading = loading;
        this.episodes = data.oneSeries.episodes;
      });
  }
}
```

Unfortunately if the user would now visit the second view without ever visiting the first view this would result in two network requests (since the data for the first query is not in the store yet). By using a [`HttpBatchLink`](https://github.com/apollographql/apollo-angular/tree/master/packages/apollo-angular-link-http-batch) those two queries can be send to the server in one network request.
