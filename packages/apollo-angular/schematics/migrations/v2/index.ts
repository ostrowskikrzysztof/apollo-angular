import {Rule, Tree, chain, SchematicContext} from '@angular-devkit/schematics';
import {NodePackageInstallTask} from '@angular-devkit/schematics/tasks';
import * as ts from 'typescript';
import {getJsonFile} from '../../utils';
import {dependenciesMap} from '../../install/index';

export default function(): Rule {
  return chain([migrateImports, migrateTsConfig, migrateDependencies]);
}

function migrateDependencies() {
  return (tree: Tree, context: SchematicContext) => {
    const packageJsonPath = 'package.json';
    const packageJson = getJsonFile(tree, packageJsonPath);

    packageJson.dependencies = packageJson.dependencies || {};

    for (const dependency in dependenciesMap) {
      if (dependenciesMap.hasOwnProperty(dependency)) {
        const version = dependenciesMap[dependency];

        packageJson.dependencies[dependency] = version;
      }
    }

    delete packageJson.dependencies['apollo-client'];
    delete packageJson.dependencies['apollo-link'];
    delete packageJson.dependencies['apollo-cache-inmemory'];
    delete packageJson.dependencies['graphql-tag'];

    context.logger.info('Removing apollo-client dependency');
    context.logger.info('Removing apollo-link dependency');
    context.logger.info('Removing apollo-cache-inmemory dependency');
    context.logger.info('Removing graphql-tag dependency');

    // save the changed file
    tree.overwrite(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // schedule `npm install`
    context.addTask(new NodePackageInstallTask());

    return tree;
  };
}

export async function migrateTsConfig(tree: Tree) {
  const tsconfigPath = 'tsconfig.json';
  const tsconfig = getJsonFile(tree, tsconfigPath);
  const compilerOptions: ts.CompilerOptions = tsconfig.compilerOptions;

  if (compilerOptions) {
    compilerOptions.allowSyntheticDefaultImports = true;
    tree.overwrite(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  }
}

export async function migrateImports(tree: Tree) {
  tree.visit(path => {
    if (path.includes('node_modules') || !path.endsWith('.ts')) {
      return;
    }

    const sourceFile = ts.createSourceFile(
      path,
      tree.read(path).toString(),
      ts.ScriptTarget.Latest,
      true,
    );

    const imports: Array<{
      name: string;
      alias?: string;
    }> = [];

    const recorder = tree.beginUpdate(path);

    sourceFile.statements.forEach(statement => {
      if (
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteral(statement.moduleSpecifier)
      ) {
        const nodeText = statement.moduleSpecifier.getText(sourceFile);
        const modulePath = statement.moduleSpecifier
          .getText(sourceFile)
          .substr(1, nodeText.length - 2);

        if (
          ['apollo-cache-inmemory', 'apollo-client', 'apollo-link', 'apollo-angular'].includes(
            modulePath,
          )
        ) {
          if (statement.importClause.namedBindings) {
            statement.importClause.namedBindings.forEachChild(named => {
              if (ts.isImportSpecifier(named)) {
                const name = named.propertyName && typeof named.propertyName !== 'undefined'
                  ? named.propertyName.escapedText.toString()
                  : named.name.escapedText.toString();

                  imports.push({
                  name,
                  alias: name === named.name.escapedText.toString() ? undefined : name,
                });
              }
            });
          }

          recorder.remove(statement.getStart(), statement.getWidth());
        }

        if (modulePath === 'graphql-tag') {
          imports.push({
            name: 'gql',
            alias:
              statement.importClause.name.escapedText.toString() === 'gql'
                ? undefined
                : statement.importClause.name.escapedText.toString(),
          });

          recorder.remove(statement.getStart(), statement.getWidth());
        }
      }
    });

    if (imports.length) {
      const props = imports
        .map(im => (im.alias ? `${im.name} as ${im.alias}` : im.name))
        .join(', ');
      recorder.insertLeft(
        sourceFile.getStart(),
        `import {${props}} from 'apollo-angular';\n`,
      );
      tree.commitUpdate(recorder);
    }
  });
}
