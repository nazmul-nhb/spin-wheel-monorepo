import "./shared/binding.d-zZoPrk0_.cjs";
import { ConfigExport, defineConfig } from "./shared/define-config.d-D8GT-e45.cjs";

//#region src/utils/load-config.d.ts
declare function loadConfig(configPath: string): Promise<ConfigExport>;

//#endregion
//#region src/config.d.ts
declare const VERSION: string;

//#endregion
export { VERSION, defineConfig, loadConfig };