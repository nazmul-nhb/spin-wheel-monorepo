import { ReportPlugin$1 as ReportPlugin, ResolvedOptions } from "./types-CsOn0For.js";
import { Plugin } from "rolldown";
import { PackageJson } from "pkg-types";

//#region src/features/external.d.ts
declare function ExternalPlugin(options: ResolvedOptions): Plugin;

//#endregion
//#region src/features/shebang.d.ts
/*
* Production deps should be excluded from the bundle
*/
declare function ShebangPlugin(cwd: string, name?: string, isMultiFormat?: boolean): Plugin;

//#endregion
//#region src/features/node-protocol.d.ts
/**
* The `node:` protocol was added in Node.js v14.18.0.
* @see https://nodejs.org/api/esm.html#node-imports
*/
declare function NodeProtocolPlugin(): Plugin;

//#endregion
export { ExternalPlugin, NodeProtocolPlugin, ReportPlugin, ShebangPlugin };