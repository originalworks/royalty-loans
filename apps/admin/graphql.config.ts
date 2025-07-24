import type { IGraphQLConfig } from 'graphql-config';

const config: IGraphQLConfig = {
  schema: process.env.VITE_SUBGRAPH_URL,
  extensions: {
    codegen: {
      hooks: {
        afterOneFileWrite: ['eslint --fix', 'prettier --write'],
      },
      generates: {
        'src/generated/graphql/schema.types.ts': {
          plugins: ['typescript'],
          config: {
            skipTypename: true,
            enumsAsTypes: true,
          },
        },
        // Uncomment this if you need these types.
        // 'src/generated/graphql/types.ts': {
        //   preset: 'import-types',
        //   documents: ['src/**/*.{ts,tsx}'],
        //   plugins: ['typescript-operations'],
        //   config: {
        //     skipTypename: true,
        //     enumsAsTypes: true,
        //     preResolveTypes: false,
        //     useTypeImports: true,
        //   },
        //   presetConfig: {
        //     typesPath: './schema.types',
        //   },
        // },
      },
    },
  },
};

export default config;
