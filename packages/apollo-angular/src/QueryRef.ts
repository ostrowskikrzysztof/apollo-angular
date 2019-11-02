import {NgZone} from '@angular/core';
import {
  ApolloQueryResult,
  ObservableQuery,
  ApolloError,
  FetchMoreQueryOptions,
  FetchMoreOptions,
  SubscribeToMoreOptions,
  UpdateQueryOptions,
  ApolloCurrentQueryResult,
} from '@apollo/client/core';
import {Observable, from} from 'rxjs';
import {startWith} from 'rxjs/operators';

import {wrapWithZone, fixObservable} from './utils';
import {WatchQueryOptions, R} from './types';

export class QueryRef<T, V = R> {
  public valueChanges: Observable<ApolloQueryResult<T>>;
  public options: ObservableQuery<T, V>['options'];

  constructor(
    private obsQuery: ObservableQuery<T, V>,
    ngZone: NgZone,
    options: WatchQueryOptions<V>,
  ) {
    const wrapped = wrapWithZone(from(fixObservable(this.obsQuery)), ngZone);

    this.valueChanges = options.useInitialLoading
      ? wrapped.pipe(
          startWith({
            ...this.obsQuery.getCurrentResult(),
            error: undefined,
            partial: undefined,
            stale: true,
          }),
        )
      : wrapped;
  }

  // ObservableQuery's methods

  public get queryId(): ObservableQuery<T, V>['queryId'] {
    return this.obsQuery.queryId;
  }
  public get queryName(): ObservableQuery<T, V>['queryName'] {
    return this.obsQuery.queryName;
  }
  public get variables(): V {
    return this.obsQuery.variables;
  }

  public result(): Promise<ApolloQueryResult<T>> {
    return this.obsQuery.result();
  }

  public getCurrentResult(): ApolloCurrentQueryResult<T> {
    return this.obsQuery.getCurrentResult();
  }

  public isDifferentFromLastResult(newResult: ApolloQueryResult<T>): boolean {
    return this.obsQuery.isDifferentFromLastResult(newResult);
  }

  public getLastResult(): ApolloQueryResult<T> {
    return this.obsQuery.getLastResult();
  }

  public getLastError(): ApolloError {
    return this.obsQuery.getLastError();
  }

  public resetLastResults(): void {
    return this.obsQuery.resetLastResults();
  }

  public refetch(variables?: V): Promise<ApolloQueryResult<T>> {
    return this.obsQuery.refetch(variables);
  }

  public fetchMore<K extends keyof V>(
    fetchMoreOptions: FetchMoreQueryOptions<V, K> & FetchMoreOptions<T, V>,
  ): Promise<ApolloQueryResult<T>> {
    return this.obsQuery.fetchMore(fetchMoreOptions);
  }

  public subscribeToMore<MT = any, MV = R>(
    options: SubscribeToMoreOptions<T, MV, MT>,
  ): () => void {
    // XXX: there's a bug in @apollo/client typings
    // it should not inherit types from ObservableQuery
    return this.obsQuery.subscribeToMore(options as any);
  }
  public updateQuery(
    mapFn: (previousQueryResult: T, options: UpdateQueryOptions<V>) => T,
  ): void {
    return this.obsQuery.updateQuery(mapFn);
  }

  public stopPolling(): void {
    return this.obsQuery.stopPolling();
  }

  public startPolling(pollInterval: number): void {
    return this.obsQuery.startPolling(pollInterval);
  }

  public setOptions(opts: any) {
    return this.obsQuery.setOptions(opts);
  }

  public setVariables(
    variables: V,
    tryFetch: boolean = false,
    fetchResults = true,
  ) {
    return this.obsQuery.setVariables(variables, tryFetch, fetchResults);
  }
}
