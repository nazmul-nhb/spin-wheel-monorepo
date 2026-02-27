import "./shared/binding.d-IJB0sH7-.mjs";
import { ConfigExport, defineConfig$1 as defineConfig } from "./shared/define-config.d-0iclTDLo.mjs";

//#region src/utils/load-config.d.ts
declare function loadConfig(configPath: string): Promise<ConfigExport>;

//#endregion
//#region src/config.d.ts
declare const VERSION: string;

//#endregion
export { VERSION, defineConfig, loadConfig };