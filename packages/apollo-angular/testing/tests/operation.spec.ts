import {gql, execute, ApolloLink} from '@apollo/client/core';

import {buildOperationForLink} from './utils';
import {ApolloTestingBackend} from '../src/backend';

describe('TestOperation', () => {
  test('accepts a null body', () => {
    const mock = new ApolloTestingBackend();
    const link = new ApolloLink(op =>
      mock.handle({
        ...op,
        clientName: 'default',
      }),
    );
    const query = gql`
      query allHeroes {
        heroes {
          name
        }
      }
    `;
    const operation = buildOperationForLink(query, {});

    let response: any;
    execute(link, operation as any).subscribe(
      (result: any) => (response = result),
    );

    mock.expectOne(query).flush(null);

    expect(response).toBeNull();
  });
});
