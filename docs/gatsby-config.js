const themeOptions = require('gatsby-theme-apollo-docs/theme-options');

module.exports = {
  plugins: [
    {
      resolve: 'gatsby-theme-apollo-docs',
      options: {
        ...themeOptions,
        root: __dirname,
        subtitle: 'Apollo Angular',
        description: 'A guide to using the Apollo GraphQL Client with Angular',
        githubRepo: 'apollographql/apollo-angular',
        defaultVersion: 1,
        sidebarCategories: {
          null: [
            'index',
            'migration',
          ],
          Basics: [
            'basics/setup',
            'basics/queries',
            'basics/mutations',
            'basics/services',
            'basics/network-layer',
            'basics/caching',
            'basics/local-state',
          ],
          Features: [
            'features/error-handling',
            'features/caching',
            'features/optimistic-ui',
            'features/cache-updates',
            'features/fragments',
            'features/developer-tooling',
            'features/subscriptions',
            'features/nativescript',
            'features/multiple-clients',
            'features/static-typing',
          ],
          Guides: [
            'guides/state-management',
            'guides/testing',
            'guides/tools-and-packages',
          ],
          Recipes: [
            'recipes/simple-example',
            'recipes/query-splitting',
            'recipes/pagination',
            'recipes/authentication',
            'recipes/prefetching',
            'recipes/server-side-rendering',
            'recipes/webpack',
            'recipes/meteor',
            'recipes/angular-cli',
            'recipes/boost-migration'
          ]
        }
      }
    }
  ]
};
