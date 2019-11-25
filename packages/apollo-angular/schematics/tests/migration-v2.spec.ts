import {resolve} from 'path';
import {Tree} from '@angular-devkit/schematics';
import {SchematicTestRunner} from '@angular-devkit/schematics/testing';
import {getFileContent} from '@schematics/angular/utility/test';
import {CompilerOptions} from 'typescript';

import {createTestApp} from '../utils';
import {dependenciesMap} from '../install';

const migrationsPath = resolve(__dirname, '../migrations.json');
const migrationName = 'migration-2.0.0';

describe('Migration: Apollo Angular V2', () => {
  let runner: SchematicTestRunner;
  let appTree: Tree;

  beforeEach(async () => {
    appTree = await createTestApp();
    runner = new SchematicTestRunner('schematics', migrationsPath);
  });

  test('should update imports', async () => {
    appTree.create(
      'file.ts',
      `
        import { InMemoryCache } from 'apollo-cache-inmemory';
        import { ApolloClient } from 'apollo-client';
        import { ApolloLink } from 'apollo-link';
        import { ApolloModule } from 'apollo-angular';
        import ApolloClient from 'apollo-client';
        import gql from 'graphql-tag';
      `,
    );
    const tree = await runner
      .runSchematicAsync(migrationName, {}, appTree)
      .toPromise();

    expect(tree.readContent('file.ts').trim()).toEqual(
      `import {InMemoryCache, ApolloClient, ApolloLink, ApolloModule, gql} from 'apollo-angular';`,
    );
  });

  test('should update imports (with aliases)', async () => {
    appTree.create(
      'file.ts',
      `
        import { InMemoryCache } from 'apollo-cache-inmemory';
        import { ApolloClient } from 'apollo-client';
        import { ApolloLink } from 'apollo-link';
        import ApolloClient from 'apollo-client';
        import graphql from 'graphql-tag';
      `,
    );
    const tree = await runner
      .runSchematicAsync(migrationName, {}, appTree)
      .toPromise();

    expect(tree.readContent('file.ts').trim()).toEqual(
      `import {InMemoryCache, ApolloClient, ApolloLink, gql as graphql} from 'apollo-angular';`,
    );
  });

  test('should enable allowSyntheticDefaultImports in tsconfig.json', async () => {
    const tree = await runner
      .runSchematicAsync(migrationName, {}, appTree)
      .toPromise();
    const rootModulePath = '/tsconfig.json';
    const compilerOptions: CompilerOptions = JSON.parse(
      getFileContent(tree, rootModulePath),
    ).compilerOptions;

    expect(compilerOptions.allowSyntheticDefaultImports).toEqual(true);
  });

  test('should update package.json', async () => {
    const oldPackageJson = JSON.parse(
      appTree.read('package.json').toString('utf-8'),
    );

    oldPackageJson.dependencies = {
      ...oldPackageJson.dependencies,
      'apollo-angular': '^1.8.0',
      'apollo-angular-link-http': '^1.9.0',
      'apollo-link': '^1.2.11',
      'apollo-client': '^2.6.0',
      'apollo-cache-inmemory': '^1.6.0',
      'graphql-tag': '^2.10.0',
      graphql: '^14.5.0',
    };

    appTree.overwrite('package.json', JSON.stringify(oldPackageJson, null, 2));

    const tree = await runner
      .runSchematicAsync(migrationName, {}, appTree)
      .toPromise();

    const packageJson = JSON.parse(tree.readContent('package.json'));

    expect(packageJson.dependencies['apollo-angular']).toEqual(
      dependenciesMap['apollo-angular'],
    );
    expect(packageJson.dependencies['apollo-angular-link-http']).toEqual(
      dependenciesMap['apollo-angular-link-http'],
    );
    expect(packageJson.dependencies['@apollo/client']).toEqual(
      dependenciesMap['@apollo/client'],
    );

    expect(packageJson.dependencies['apollo-client']).toBeUndefined();
    expect(packageJson.dependencies['apollo-link']).toBeUndefined();
    expect(packageJson.dependencies['apollo-cache-inmemory']).toBeUndefined();
    expect(packageJson.dependencies['graphql-tag']).toBeUndefined();
  });
});
