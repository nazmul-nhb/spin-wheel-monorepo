import { BuildContext, Options, ResolvedOptions, TsdownHooks, UserConfig, UserConfigFn } from "./types-CsOn0For.js";
import { defineConfig$1 as defineConfig } from "./config-GQTSGL72.js";
import "ansis";
import { InternalModuleFormat } from "rolldown";

//#region src/utils/logger.d.ts
declare class Logger {
  silent: boolean;
  setSilent(value: boolean): void;
  filter(...args: any[]): any[];
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  success(...args: any[]): void;
}
declare const logger: Logger; //#endregion
//#region src/index.d.ts
/**
* Build with tsdown.
*/
declare function build(userOptions?: Options): Promise<void>;
declare const pkgRoot: string;
/**
* Build a single configuration, without watch and shortcuts features.
*
* Internal API, not for public use
*
* @private
* @param config Resolved options
*/
declare function buildSingle(config: ResolvedOptions, clean: () => Promise<void>): Promise<(() => Promise<void>) | undefined>;

//#endregion
export { BuildContext, Options, TsdownHooks, UserConfig, UserConfigFn, build, buildSingle, defineConfig, logger, pkgRoot };