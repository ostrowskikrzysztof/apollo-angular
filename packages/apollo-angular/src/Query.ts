import {Injectable} from '@angular/core';
import {ApolloQueryResult} from '@apollo/client/core';
import {DocumentNode} from 'graphql';
import {Observable} from 'rxjs';

import {Apollo} from './Apollo';
import {QueryRef} from './QueryRef';
import {WatchQueryOptionsAlone, QueryOptionsAlone, R} from './types';

@Injectable()
export class Query<T = {}, V = R> {
  public readonly document: DocumentNode;
  public client = 'default';

  constructor(protected apollo: Apollo) {}

  public watch(
    variables?: V,
    options?: WatchQueryOptionsAlone<V>,
  ): QueryRef<T, V> {
    return this.apollo.use(this.client).watchQuery<T, V>({
      ...options,
      variables,
      query: this.document,
    });
  }

  public fetch(
    variables?: V,
    options?: QueryOptionsAlone<V>,
  ): Observable<ApolloQueryResult<T>> {
    return this.apollo.use(this.client).query<T, V>({
      ...options,
      variables,
      query: this.document,
    });
  }
}
