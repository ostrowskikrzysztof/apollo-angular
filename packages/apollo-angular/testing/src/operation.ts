import {
  ApolloError,
  Operation as LinkOperation,
  FetchResult,
} from '@apollo/client/core';
import {GraphQLError, ExecutionResult} from 'graphql';
import {Observer} from 'rxjs';

const isApolloError = (err: any): err is ApolloError =>
  err && err.hasOwnProperty('graphQLErrors');

export type Operation = LinkOperation & {
  clientName: string;
};

export class TestOperation {
  constructor(
    public operation: Operation,
    private observer: Observer<FetchResult>,
  ) {}

  public flush(result: ExecutionResult | ApolloError): void {
    if (isApolloError(result)) {
      this.observer.error(result);
    } else {
      this.observer.next(result as FetchResult);
      this.observer.complete();
    }
  }

  public networkError(error: Error): void {
    const apolloError = new ApolloError({
      networkError: error,
    });

    this.flush(apolloError);
  }

  public graphqlErrors(errors: GraphQLError[]): void {
    this.flush({
      errors,
    });
  }
}
