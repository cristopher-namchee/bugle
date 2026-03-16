import { globSync } from 'tinyglobby';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: globSync(['src/**/*.ts'], {
    ignore: ['**/*.test.ts', '**/*.spec.ts'],
  }),
});
