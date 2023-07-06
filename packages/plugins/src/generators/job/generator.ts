import {
  formatFiles,
  generateFiles,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { existsSync } from 'node:fs';
import { JobGeneratorSchema } from './schema.d';
import { toKebabCase } from '../helpers';

export async function jobGenerator(tree: Tree, options: JobGeneratorSchema) {
  const jobName = toKebabCase(options.jobName);
  const pluginId = toKebabCase(options.pluginId);
  const libraryRoot = readProjectConfiguration(tree, 'plugins').root;

  if (!existsSync(`${libraryRoot}/src/plugins/${pluginId}`)) {
    throw new Error(`The provided plugin does not exist: ${pluginId}`);
  }

  const substitutions = {
    pluginId,
    jobName,
  };

  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    libraryRoot,
    substitutions
  );
  await formatFiles(tree);
}

export default jobGenerator;
