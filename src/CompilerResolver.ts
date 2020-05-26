import * as fse from 'fs-extra';
import resolve = require('enhanced-resolve');
import { Shout } from './Shout';
import chalk = require('chalk');
import { CLIEngine } from 'eslint';
import VueTemplateCompiler = require('vue-template-compiler');
import * as upath from 'upath';

function resolveAsync(basePath: string, query: string): Promise<string> {
    return new Promise<string>((ok, reject) => {
        resolve(basePath, query, (err: Error, result: string) => {
            if (err) {
                reject(err);
            } 
            else if (!result){
                reject(`Resolve resulted in undefined value: ${basePath} imports ${query}`)
            }
            else {
                ok(result);
            }
        });
    });
}

async function tryGetProjectPackageVersion(projectBasePath: string, packageName: string): Promise<string | undefined> {
    try {
        let jsonPath = await resolveAsync(projectBasePath, packageName + '/package.json');
        jsonPath = upath.toUnix(jsonPath);
        if (jsonPath.startsWith(projectBasePath) === false) {
            // explicitly prevent resolution in parent folder...
            return undefined;
        }
        const json = await fse.readJson(jsonPath);
        const version = json['version'];
        return version;
    } catch (error) {
        return undefined;
    }
}

async function tryGetProjectPackage(projectBasePath: string, packageName: string): Promise<unknown> {
    try {
        let modulePath = await resolveAsync(projectBasePath, packageName);
        modulePath = upath.toUnix(modulePath);
        if (modulePath.startsWith(projectBasePath) === false) {
            // explicitly prevent resolution in parent folder...
            return undefined;
        }
        return require(modulePath);
    } catch (error) {
        return undefined;
    }
}

export async function resolveVue2TemplateCompiler(projectBasePath: string): Promise<unknown> {
    const instapackVueCompilerVersion: string = require('vue-template-compiler/package.json')['version'];
    const vueVersion = await tryGetProjectPackageVersion(projectBasePath, 'vue');

    try {
        const vueCompilerVersion = await tryGetProjectPackageVersion(projectBasePath, 'vue-template-compiler');

        if (!vueVersion || !vueCompilerVersion) {
            throw new Error('Project Vue / Vue Template Compiler packages are not found.');
        }

        if (vueVersion !== vueCompilerVersion) {
            Shout.warning(`Project vue (${vueVersion}) and vue-template-compiler (${vueCompilerVersion}) version mismatch!`
                + chalk.grey(`
Fix the project package.json and make sure to use the same version for both:
    yarn add vue-template-compiler@${vueVersion} -D -E
                        OR
    npm install vue-template-compiler@${vueVersion} -D -E
`));
            Shout.warning('Fallback to instapack default built-in Vue Template Compiler...');
            throw new Error('Project vue and vue-template-compiler version mismatched!');
        }

        const compilerPath = await resolveAsync(projectBasePath, 'vue-template-compiler');
        Shout.timed('Using project Vue Template Compiler', chalk.green(vueCompilerVersion));
        return require(compilerPath);
    } catch (err) {
        if (vueVersion && vueVersion !== instapackVueCompilerVersion) {
            Shout.warning(`instapack built-in vue-template-compiler (${instapackVueCompilerVersion}) and project vue (${vueVersion}) version mismatch!`
                + chalk.grey(`
This may introduce bugs to the application. Please add a custom vue-template-compiler dependency to the project:
    yarn add vue-template-compiler@${vueVersion} -D -E
                        OR
    npm install vue-template-compiler@${vueVersion} -D -E
`));
        }

        return VueTemplateCompiler;
    }
}

interface ESLintConstructor {
    new(options: CLIEngine.Options): CLIEngine;
    version: string;
}

export async function tryGetProjectESLint(projectBasePath: string, indexTsPath: string): Promise<ESLintConstructor | undefined> {
    try {
        const eslint = await tryGetProjectPackage(projectBasePath, 'eslint') as {
            CLIEngine: ESLintConstructor;
        };
        // console.log(eslint);
        const cliEngine = new eslint.CLIEngine({});
        cliEngine.getConfigForFile(indexTsPath);
        // const config = cliEngine.getConfigForFile(indexTsPath);
        // console.log(config);
        return eslint.CLIEngine;
    } catch (error) {
        // console.log(error);
        return undefined;
    }
}
