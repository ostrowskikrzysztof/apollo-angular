---
title: Authentication
---

Unless all of the data you are loading is completely public, your app has some sort of users, accounts and permissions systems. If different users have different permissions in your application, then you need a way to tell the server which user is associated with each request.

Apollo Client uses the ultra flexible [Apollo Link](https://www.apollographql.com/docs/link) that includes several options for authentication.

## Cookie

If your app is browser based and you are using cookies for login and session management with a backend, it is very easy to tell your network interface to send the cookie along with every request.

```ts
import { Apollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular-link-http';

@NgModule({ ... })
class AppModule {
  constructor(
    apollo: Apollo,
    httpLink: HttpLink
  ) {
    const link = httpLink.create({
      uri: '/graphql',
      withCredentials: true
    });

    apollo.create({
      link,
      // other options like cache
    });
  }
}
```

`withCredentials` is simply passed to the [`HttpClient`](https://angular.io/api/common/http/HttpClient) used by the `HttpLink` when sending the query.

Note: the backend must also allow credentials from the requested origin. e.g. if using the popular 'cors' package from npm in node.js.

## Header

Another common way to identify yourself when using HTTP is to send along an authorization header. Apollo Links make creating middlewares that lets you modify requests before they are sent to the server. It's easy to add an `Authorization` header to every HTTP request. In this example, we'll pull the login token from `localStorage` every time a request is sent.

In `graphql.module.ts`:

```ts
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ApolloModule, Apollo, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLinkModule, HttpLink } from 'apollo-angular-link-http';
import { InMemoryCache, ApolloLink } from '@apollo/client/common';

const uri = '/graphql';

export function provideApollo(httpLink: HttpLink) {
  const basic = setContext((operation, context) => ({
    headers: {
      Accept: 'charset=utf-8'
    }
  }));

  // Get the authentication token from local storage if it exists
  const token = localStorage.getItem('token');
  const auth = setContext((operation, context) => ({
    headers: {
      Authorization: `Bearer ${token}`
    },
  }));

  const link = ApolloLink.from([basic, auth, httpLink.create({ uri })]);
  const cache = new InMemoryCache();

  return {
    link,
    cache
  }
}

@NgModule({
  exports: [
    HttpClientModule,
    ApolloModule,
    HttpLinkModule
  ],
  providers: [{
    provide: APOLLO_OPTIONS,
    useFactory: provideApollo,
    deps: [HttpLink]
  }]
})
export class GraphQLModule {}

```

The server can use that header to authenticate the user and attach it to the GraphQL execution context, so resolvers can modify their behavior based on a user's role and permissions.

### Waiting for a refreshed token

In the case that you need to a refresh a token, for example when using the [adal.js](https://github.com/AzureAD/azure-activedirectory-library-for-js) library, you can use an observable wrapped in a promise to wait for a new token:

```ts
import { setContext } from 'apollo-link-context';

const auth = setContext(async(_, { headers }) => {
  // Grab token if there is one in storage or hasn't expired
  let token = this.auth.getCachedAccessToken();

  if (!token) {
    // An observable to fetch a new token
    // Converted .toPromise()
    await this.auth.acquireToken().toPromise();

    // Set new token to the response (adal puts the new token in storage when fetched)
    token = this.auth.getCachedAccessToken();
  }
  // Return the headers as usual
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
});
```

## Reset store on logout

Since Apollo caches all of your query results, it's important to get rid of them when the login state changes.

The easiest way to ensure that the UI and store state reflects the current user's permissions is to call `Apollo.getClient().resetStore()` after your login or logout process has completed. This will cause the store to be cleared and all active queries to be refetched.

Another option is to reload the page, which will have a similar effect.

```ts
import { Apollo } from 'apollo-angular';
import { gql } from '@apollo/client/common';

const PROFILE_QUERY = gql`
  query CurrentUserForLayout {
    currentUser {
      login
      avatar_url
    }
  }
`;

@Injectable()
class AuthService {
constructor(private apollo: Apollo) {}
  logout() {
    // some app logic

    // reset the store after that
    this.apollo.getClient().resetStore();
  }
}

@Component({
  template: `
    <ng-template *ngIf="loggedIn">
      <user-card [user]="user"></user-card>
      <button (click)="logout()">Logout</button>
    </ng-template>

    <button *ngIf="!loggedIn" (click)="goToLoginPage()">Go SignIn</button>
  `
})
class ProfileComponent {
  apollo: Apollo;
  auth: Auth;
  user: any;
  loggedIn: boolean;

  ngOnInit() {
    this.apollo.query({
      query: PROFILE_QUERY,
      fetchPolicy: 'network-only'
    }).subscribe(({data}) => {
      this.user = data.currentUser;
    });
  }

  logout() {
    this.loggedIn = false;
    this.auth.logout();
  }
}
```
