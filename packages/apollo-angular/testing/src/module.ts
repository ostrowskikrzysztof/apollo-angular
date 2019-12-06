import {ApolloModule, Apollo} from 'apollo-angular';
import {
  ApolloLink,
  Operation as LinkOperation,
  ApolloCache,
} from '@apollo/client/core';
import {InMemoryCache} from '@apollo/client/core';
import {
  NgModule,
  InjectionToken,
  Inject,
  Optional,
  ModuleWithProviders,
} from '@angular/core';

import {ApolloTestingController} from './controller';
import {ApolloTestingBackend} from './backend';
import {Operation} from './operation';

export type NamedCaches = Record<string, ApolloCache<any> | undefined | null>;

export const APOLLO_TESTING_CACHE = new InjectionToken<ApolloCache<any>>(
  'apollo-angular/testing cache',
);

export const APOLLO_TESTING_NAMED_CACHE = new InjectionToken<NamedCaches>(
  'apollo-angular/testing named cache',
);

export const APOLLO_TESTING_CLIENTS = new InjectionToken<string[]>(
  'apollo-angular/testing named clients',
);

function addClient(name: string, op: LinkOperation): Operation {
  (op as Operation).clientName = name;

  return op as Operation;
}

@NgModule({
  imports: [ApolloModule],
  providers: [
    ApolloTestingBackend,
    {provide: ApolloTestingController, useExisting: ApolloTestingBackend},
  ],
})
export class ApolloTestingModuleCore {
  constructor(
    apollo: Apollo,
    backend: ApolloTestingBackend,
    @Optional()
    @Inject(APOLLO_TESTING_CLIENTS)
    namedClients?: string[],
    @Optional()
    @Inject(APOLLO_TESTING_CACHE)
    cache?: ApolloCache<any>,
    @Optional()
    @Inject(APOLLO_TESTING_NAMED_CACHE)
    namedCaches?: any, // FIX: using NamedCaches here makes ngc fail
  ) {
    function createOptions(name: string, c?: ApolloCache<any> | null) {
      return {
        link: new ApolloLink(operation =>
          backend.handle(addClient(name, operation)),
        ),
        cache:
          c ||
          new InMemoryCache({
            addTypename: false,
          }),
      };
    }

    apollo.create(createOptions('default', cache));

    if (namedClients && namedClients.length) {
      namedClients.forEach(name => {
        const caches =
          namedCaches && typeof namedCaches === 'object' ? namedCaches : {};

        apollo.createNamed(name, createOptions(name, caches[name]));
      });
    }
  }
}

@NgModule({
  imports: [ApolloTestingModuleCore],
})
export class ApolloTestingModule {
  static withClients(names: string[]): ModuleWithProviders {
    return {
      ngModule: ApolloTestingModuleCore,
      providers: [
        {
          provide: APOLLO_TESTING_CLIENTS,
          useValue: names,
        },
      ],
    };
  }
}
