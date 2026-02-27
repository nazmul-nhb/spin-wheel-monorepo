const require_src = require('./shared/src-DUvB0HDu.cjs');
require('./shared/parse-ast-index-CtQjLtqj.cjs');
require('./shared/misc-BKp5iIef.cjs');
const require_load_config = require('./shared/load-config-BAYWM1g8.cjs');

//#region src/config.ts
const VERSION = require_src.version;

//#endregion
exports.VERSION = VERSION;
exports.defineConfig = require_src.defineConfig;
exports.loadConfig = require_load_config.loadConfig;