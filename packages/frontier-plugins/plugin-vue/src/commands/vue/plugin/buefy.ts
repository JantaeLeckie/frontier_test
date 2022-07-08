import shell from 'shelljs';
import cli from 'cli-ux';
const util = require('util');
const exec = util.promisify(shell.exec);
import { Command, flags } from '@oclif/command';
import path from 'path';
import { Files } from 'modules';
import { copyFiles, inject, parseModuleConfig, updateDynamicImportsAndExports } from '../../../utils/files';
import { checkProjectValidity } from '../../../utils/utilities';
import { CLI_COMMANDS, CLI_STATE } from '../../../utils/constants';
import { injectImportsIntoMain } from '../../../utils/plugins';
import { Route } from 'modules/manifest';
import { catchError } from '@rdfrontier/plugin-shared/types/catch';;
import { invalidProject } from '@rdfrontier/plugin-shared/types/errors';

const TEMPLATE_FOLDERS = ['buefy'];
const TEMPLATE_MIN_VERSION_SUPPORTED = 2;

/**
 * Class representing buefy plugin.
 * @extends Command
 */
export default class Buefy extends Command {
  static description = 'lightweigth UI components for Vuejs'

  static flags = {
    help: flags.help({ char: 'h' }),
    forceProject: flags.string({ hidden: true }),
    skipInstall: flags.boolean({ hidden: true }),
  }

  static args = []

  // override Command class error handler
  catch(error: Error): Promise<any> {
    return catchError(error, CLI_STATE);
  }

  async run(): Promise<void> {
    const { flags } = this.parse(Buefy);
    const projectName = flags.forceProject;
    const skipInstallStep = flags.skipInstall === true;
    const hasProjectName = projectName !== undefined;
    const preInstallCommand = hasProjectName ? `cd ${projectName} &&` : '';

    const projectValidity = checkProjectValidity();
    const { isValid: isValidProject } = projectValidity;
    let { projectRoot } = projectValidity;

    // block command unless being run within an rdvue project
    if (isValidProject === false && !hasProjectName) {
      invalidProject(CLI_COMMANDS.PluginBuefy, "rdvue");
    } else if (hasProjectName) {
      const dir = path.join(process.cwd(), projectName ?? '');
      projectRoot = dir.trim();
    }

    const folderList = TEMPLATE_FOLDERS;

    // parse config files required for scaffolding this module
    const configs = parseModuleConfig(folderList, projectRoot);
    const config = configs[0];
    const files: Array<string | Files> = config.manifest.files;
    const dependencies = config.manifest.packages.dependencies.toString()
      .split(',')
      .join(' ');

    if (skipInstallStep === false) {
      try {
        // install dependencies
        cli.action.start(`${CLI_STATE.Info} installing buefy dependencies`);
        await exec(`${preInstallCommand} npm install --save ${dependencies}`, { silent: true });
        cli.action.stop();
      } catch (error) {
        throw new Error(
          JSON.stringify({
            code: 'dependency-install-error',
            message: `${this.id?.split(':')[1]} buefy dependencies failed to install`,
          }),
        );
      }
    } else {
      cli.action.start(`${CLI_STATE.Info} adding buefy dependencies`);
      await exec(`cd ${projectName} && npx add-dependencies ${dependencies}`, { silent: true });
      cli.action.stop();
    }

    const sourceDirectory: string = path.join(config.moduleTemplatePath, config.manifest.sourceDirectory);
    const installDirectory: string = path.join(projectRoot, 'src', config.manifest.installDirectory);
    const routePath: string = path.join(projectRoot, 'src', 'config', 'router.ts');

    // copy and update files for plugin being added
    await copyFiles(sourceDirectory, installDirectory, files);
    const { routes }: { routes: Array<Route> } = config.manifest;
    if (routes && routes.length > 0) {
      const formattedContent: string = JSON.stringify(routes, null, 2)
        .replace(/(?<!\\)"/g, '')     // remove escaped quotes added by JSON.stringify
        .replace(/[\\]+"/g, '"')      // remove extra escaping slashes from escaped double quotes
        .replace(/^\s*\[\n/, '')      // remove the array notation from the start of the string
        .replace(/\s*\]$/, '')        // remove the array notation from the end of the string
        .replace(/^(\s*)/gm, '$1  '); // add extra spaces to align injected code with existing code
      const content = `${formattedContent},`;
      inject(routePath, content, {
        index: (lines, file) => {
          const index = lines.findIndex(line => line.trim().startsWith('routes: ['));
          if (index < 0) {
            throw new Error(`Could not find routes in ${file}`);
          }

          return index + 1;
        },
      });
    }
    updateDynamicImportsAndExports(projectRoot, 'theme', config.manifest.projectTheme, '_all.scss');
    updateDynamicImportsAndExports(projectRoot, 'modules/core', config.manifest.moduleImports, 'index.ts');
    if (config.manifest.version >= TEMPLATE_MIN_VERSION_SUPPORTED) {
      const { imports: mainImports } = config.manifest.main;
      injectImportsIntoMain(projectRoot, mainImports);
    }

    if (skipInstallStep === false) {
      this.log(`${CLI_STATE.Success} plugin added: ${this.id?.split(':')[1]}`);
    }
  }
}
