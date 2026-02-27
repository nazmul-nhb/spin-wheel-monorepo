import { defineConfig } from "./config-yiJy1jd0.js";
import { ExternalPlugin, NodeProtocolPlugin, ReportPlugin, ShebangPlugin, fsCopy, fsRemove, fsStat, lowestCommonAncestor } from "./plugins-BV3QPDFO.js";
import { debounce, generateColor, logger, prettyName, resolveComma, resolveRegex, slash, toArray } from "./logger-DcIo21Wv.js";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { blue, bold, dim, green, underline } from "ansis";
import { build as build$1 } from "rolldown";
import { exec } from "tinyexec";
import Debug from "debug";
import { glob } from "tinyglobby";
import { readFile } from "node:fs/promises";
import { createHooks } from "hookable";
import { up } from "empathic/package";
import readline from "node:readline";
import minVersion from "semver/ranges/min-version.js";
import { up as up$1 } from "empathic/find";
import { loadConfig } from "unconfig";

//#region src/features/clean.ts
const debug$3 = Debug("tsdown:clean");
const RE_LAST_SLASH = /[/\\]$/;
async function cleanOutDir(configs) {
	const removes = new Set();
	for (const config of configs) {
		if (!config.clean.length) continue;
		const files = await glob(config.clean, {
			cwd: config.cwd,
			absolute: true,
			onlyFiles: false
		});
		const normalizedOutDir = config.outDir.replace(RE_LAST_SLASH, "");
		for (const file of files) {
			const normalizedFile = file.replace(RE_LAST_SLASH, "");
			if (normalizedFile !== normalizedOutDir) removes.add(file);
		}
	}
	if (!removes.size) return;
	logger.info(`Cleaning ${removes.size} files`);
	await Promise.all([...removes].map(async (file) => {
		debug$3("Removing", file);
		await fsRemove(file);
	}));
	debug$3("Removed %d files", removes.size);
}
function resolveClean(clean, outDir, cwd) {
	if (clean === true) clean = [slash(outDir)];
	else if (!clean) clean = [];
	if (clean.some((item) => path.resolve(item) === cwd)) throw new Error("Cannot clean the current working directory. Please specify a different path to clean option.");
	return clean;
}

//#endregion
//#region src/features/copy.ts
async function copy(options) {
	if (!options.copy) return;
	const copy$1 = typeof options.copy === "function" ? await options.copy(options) : options.copy;
	await Promise.all(toArray(copy$1).map((dir) => {
		const from = typeof dir === "string" ? dir : dir.from;
		const to = typeof dir === "string" ? path.resolve(options.outDir, path.basename(from)) : dir.to;
		return cp$1(options.cwd, from, to);
	}));
}
function cp$1(cwd, from, to) {
	return fsCopy(path.resolve(cwd, from), path.resolve(cwd, to));
}

//#endregion
//#region src/features/hooks.ts
async function createHooks$1(options, pkg) {
	const hooks = createHooks();
	if (typeof options.hooks === "object") hooks.addHooks(options.hooks);
	else if (typeof options.hooks === "function") await options.hooks(hooks);
	const context = {
		options,
		pkg,
		hooks
	};
	return {
		hooks,
		context
	};
}

//#endregion
//#region src/utils/lightningcss.ts
/**
* Converts esbuild target [^1] (which is also used by Rolldown [^2]) to Lightning CSS targets [^3].
*
* [^1]: https://esbuild.github.io/api/#target
* [^2]: https://github.com/rolldown/rolldown/blob/v1.0.0-beta.8/packages/rolldown/src/binding.d.ts#L1429-L1431
* [^3]: https://lightningcss.dev/transpilation.html
*/
function esbuildTargetToLightningCSS(target) {
	let targets;
	const targetString = target.join(" ").toLowerCase();
	const matches = [...targetString.matchAll(TARGET_REGEX)];
	for (const match of matches) {
		const name = match[1];
		const browser = ESBUILD_LIGHTNINGCSS_MAPPING[name];
		if (!browser) continue;
		const version = match[2];
		const versionInt = parseVersion(version);
		if (versionInt == null) continue;
		targets = targets || {};
		targets[browser] = versionInt;
	}
	return targets;
}
const TARGET_REGEX = /([a-z]+)(\d+(?:\.\d+)*)/g;
const ESBUILD_LIGHTNINGCSS_MAPPING = {
	chrome: "chrome",
	edge: "edge",
	firefox: "firefox",
	ie: "ie",
	ios: "ios_saf",
	opera: "opera",
	safari: "safari"
};
function parseVersion(version) {
	const [major, minor = 0, patch = 0] = version.split("-")[0].split(".").map((v) => Number.parseInt(v, 10));
	if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) return null;
	return major << 16 | minor << 8 | patch;
}

//#endregion
//#region src/features/lightningcss.ts
async function LightningCSSPlugin(options) {
	const LightningCSS = await import("unplugin-lightningcss/rolldown").catch(() => void 0);
	if (!LightningCSS) return;
	const targets = options.target && esbuildTargetToLightningCSS(options.target);
	if (!targets) return;
	return LightningCSS.default({ options: { targets } });
}

//#endregion
//#region src/utils/package.ts
const debug$2 = Debug("tsdown:package");
async function readPackageJson(dir) {
	const packageJsonPath = up({ cwd: dir });
	if (!packageJsonPath) return;
	debug$2("Reading package.json:", packageJsonPath);
	const contents = await readFile(packageJsonPath, "utf8");
	return JSON.parse(contents);
}
function getPackageType(pkg) {
	if (pkg?.type) {
		if (!["module", "commonjs"].includes(pkg.type)) throw new Error(`Invalid package.json type: ${pkg.type}`);
		return pkg.type;
	}
}
function normalizeFormat(format) {
	return resolveComma(toArray(format, "es")).map((format$1) => {
		switch (format$1) {
			case "es":
			case "esm":
			case "module": return "es";
			case "cjs":
			case "commonjs": return "cjs";
			default: return format$1;
		}
	});
}

//#endregion
//#region src/features/output.ts
function resolveJsOutputExtension(packageType, format, fixedExtension) {
	switch (format) {
		case "es": return !fixedExtension && packageType === "module" ? "js" : "mjs";
		case "cjs": return fixedExtension || packageType === "module" ? "cjs" : "js";
		default: return "js";
	}
}
function resolveChunkFilename({ outExtensions, fixedExtension, pkg, hash }, inputOptions, format) {
	const packageType = getPackageType(pkg);
	let jsExtension;
	let dtsExtension;
	if (outExtensions) {
		const { js, dts } = outExtensions({
			options: inputOptions,
			format,
			pkgType: packageType
		}) || {};
		jsExtension = js;
		dtsExtension = dts;
	}
	jsExtension ||= `.${resolveJsOutputExtension(packageType, format, fixedExtension)}`;
	const suffix = format === "iife" || format === "umd" ? `.${format}` : "";
	return [createChunkFilename(`[name]${suffix}`, jsExtension, dtsExtension), createChunkFilename(`[name]${suffix}${hash ? "-[hash]" : ""}`, jsExtension, dtsExtension)];
}
function createChunkFilename(basename, jsExtension, dtsExtension) {
	if (!dtsExtension) return `${basename}${jsExtension}`;
	return (chunk) => {
		return `${basename}${chunk.name.endsWith(".d") ? dtsExtension : jsExtension}`;
	};
}

//#endregion
//#region src/features/publint.ts
const debug$1 = Debug("tsdown:publint");
async function publint(options) {
	if (!options.publint) return;
	if (!options.pkg) {
		logger.warn("publint is enabled but package.json is not found");
		return;
	}
	const t = performance.now();
	debug$1("Running publint");
	const { publint: publint$1 } = await import("publint");
	const { formatMessage } = await import("publint/utils");
	const { messages } = await publint$1(options.publint === true ? {} : options.publint);
	debug$1("Found %d issues", messages.length);
	if (!messages.length) logger.success(`No publint issues found`, dim`(${Math.round(performance.now() - t)}ms)`);
	let hasError = false;
	for (const message of messages) {
		hasError ||= message.type === "error";
		const formattedMessage = formatMessage(message, options.pkg);
		const logType = {
			error: "error",
			warning: "warn",
			suggestion: "info"
		}[message.type];
		logger[logType](formattedMessage);
	}
	if (hasError) {
		debug$1("Found errors, setting exit code to 1");
		process.exitCode = 1;
	}
}

//#endregion
//#region src/features/shims.ts
function getShimsInject(format, platform) {
	if (format === "es" && platform === "node") {
		const shimFile = path.resolve(pkgRoot, "esm-shims.js");
		return {
			__dirname: [shimFile, "__dirname"],
			__filename: [shimFile, "__filename"]
		};
	}
}

//#endregion
//#region src/features/shortcuts.ts
function shortcuts(restart) {
	let actionRunning = false;
	async function onInput(input) {
		if (actionRunning) return;
		const SHORTCUTS = [
			{
				key: "r",
				description: "reload config and rebuild",
				action() {
					rl.close();
					restart();
				}
			},
			{
				key: "c",
				description: "clear console",
				action() {
					console.clear();
				}
			},
			{
				key: "q",
				description: "quit",
				action() {
					process.exit(0);
				}
			}
		];
		if (input === "h") {
			const loggedKeys = new Set();
			logger.info("  Shortcuts");
			for (const shortcut$1 of SHORTCUTS) {
				if (loggedKeys.has(shortcut$1.key)) continue;
				loggedKeys.add(shortcut$1.key);
				if (shortcut$1.action == null) continue;
				logger.info(dim`  press ` + bold`${shortcut$1.key} + enter` + dim` to ${shortcut$1.description}`);
			}
			return;
		}
		const shortcut = SHORTCUTS.find((shortcut$1) => shortcut$1.key === input);
		if (!shortcut) return;
		actionRunning = true;
		await shortcut.action();
		actionRunning = false;
	}
	const rl = readline.createInterface({ input: process.stdin });
	rl.on("line", onInput);
}

//#endregion
//#region src/features/target.ts
function resolveTarget(target, pkg, name) {
	if (target === false) return;
	if (target == null) {
		const pkgTarget = resolvePackageTarget(pkg);
		if (pkgTarget) target = pkgTarget;
		else return;
	}
	const targets = resolveComma(toArray(target));
	if (targets.length) logger.info(prettyName(name), `target${targets.length > 1 ? "s" : ""}: ${generateColor(name)(targets.join(", "))}`);
	return targets;
}
function resolvePackageTarget(pkg) {
	const nodeVersion = pkg?.engines?.node;
	if (!nodeVersion) return;
	const nodeMinVersion = minVersion(nodeVersion);
	if (!nodeMinVersion) return;
	if (nodeMinVersion.version === "0.0.0") return;
	return `node${nodeMinVersion.version}`;
}
let warned = false;
function RuntimeHelperCheckPlugin(targets) {
	return {
		name: "tsdown:runtime-helper-check",
		resolveId: {
			filter: { id: /^@oxc-project\/runtime/ },
			async handler(id, ...args) {
				const EXTERNAL = {
					id,
					external: true
				};
				if (warned) return EXTERNAL;
				const resolved = await this.resolve(id, ...args);
				if (!resolved) {
					if (!warned) {
						warned = true;
						logger.warn(`The target environment (${targets.join(", ")}) requires runtime helpers from ${blue`@oxc-project/runtime`}. Please install it to ensure all necessary polyfills are included.\nFor more information, visit: https://tsdown.dev/options/target#runtime-helpers`);
					}
					return EXTERNAL;
				}
				return resolved;
			}
		}
	};
}

//#endregion
//#region src/features/watch.ts
const endsWithConfig = /[\\/](?:package\.json|tsdown\.config.*)$/;
async function watchBuild(options, configFiles, rebuild, restart) {
	if (typeof options.watch === "boolean" && options.outDir === options.cwd) throw new Error(`Watch is enabled, but output directory is the same as the current working directory.Please specify a different watch directory using ${blue`watch`} option,or set ${blue`outDir`} to a different directory.`);
	const files = toArray(typeof options.watch === "boolean" ? options.cwd : options.watch);
	logger.info(`Watching for changes in ${files.join(", ")}`);
	files.push(...configFiles);
	const { watch } = await import("chokidar");
	const debouncedRebuild = debounce(rebuild, 100);
	const watcher = watch(files, {
		ignoreInitial: true,
		ignorePermissionErrors: true,
		ignored: [
			/[\\/]\.git[\\/]/,
			/[\\/]node_modules[\\/]/,
			options.outDir,
			...toArray(options.ignoreWatch)
		]
	});
	watcher.on("all", (type, file) => {
		if (configFiles.includes(file) || endsWithConfig.test(file)) {
			logger.info(`Reload config: ${file}`);
			restart();
			return;
		}
		logger.info(`Change detected: ${type} ${file}`);
		debouncedRebuild();
	});
	return watcher;
}

//#endregion
//#region src/features/entry.ts
async function resolveEntry(entry, cwd, name) {
	const nameLabel = name ? `[${name}] ` : "";
	if (!entry || Object.keys(entry).length === 0) throw new Error(`${nameLabel}No input files, try "tsdown <your-file>" instead`);
	const entryMap = await toObjectEntry(entry, cwd);
	const entries = Object.values(entryMap);
	if (entries.length === 0) throw new Error(`${nameLabel}Cannot find entry: ${JSON.stringify(entry)}`);
	logger.info(prettyName(name), `entry: ${generateColor(name)(entries.map((entry$1) => path.relative(cwd, entry$1)).join(", "))}`);
	return entryMap;
}
async function toObjectEntry(entry, cwd) {
	if (typeof entry === "string") entry = [entry];
	if (!Array.isArray(entry)) return entry;
	const resolvedEntry = await glob(entry, {
		cwd,
		absolute: true
	});
	const base = lowestCommonAncestor(...resolvedEntry);
	return Object.fromEntries(resolvedEntry.map((file) => {
		const relative = path.relative(base, file);
		return [relative.slice(0, relative.length - path.extname(relative).length), file];
	}));
}

//#endregion
//#region src/features/tsconfig.ts
function findTsconfig(cwd, name = "tsconfig.json") {
	return up$1(name, { cwd }) || false;
}
async function resolveTsconfig(tsconfig, cwd, name) {
	const original = tsconfig;
	if (tsconfig !== false) {
		if (tsconfig === true || tsconfig == null) {
			tsconfig = findTsconfig(cwd);
			if (original && !tsconfig) logger.warn(`No tsconfig found in ${blue(cwd)}`);
		} else {
			const tsconfigPath = path.resolve(cwd, tsconfig);
			const stat$1 = await fsStat(tsconfigPath);
			if (stat$1?.isFile()) tsconfig = tsconfigPath;
			else if (stat$1?.isDirectory()) {
				tsconfig = findTsconfig(tsconfigPath);
				if (!tsconfig) logger.warn(`No tsconfig found in ${blue(tsconfigPath)}`);
			} else {
				tsconfig = findTsconfig(cwd, tsconfig);
				if (!tsconfig) logger.warn(`tsconfig ${blue(original)} doesn't exist`);
			}
		}
		if (tsconfig) logger.info(prettyName(name), `tsconfig: ${generateColor(name)(path.relative(cwd, tsconfig))}`);
	}
	return tsconfig;
}

//#endregion
//#region src/options/config.ts
async function loadViteConfig(prefix, cwd) {
	const { config, sources: [source] } = await loadConfig({
		sources: [{
			files: `${prefix}.config`,
			extensions: [
				"ts",
				"mts",
				"cts",
				"js",
				"mjs",
				"cjs",
				"json",
				""
			]
		}],
		cwd,
		defaults: {}
	});
	if (!source) return;
	logger.info(`Using Vite config: ${underline(source)}`);
	const resolved = await config;
	if (typeof resolved === "function") return resolved({
		command: "build",
		mode: "production"
	});
	return resolved;
}
let loaded = false;
async function loadConfigFile(options, workspace) {
	let cwd = options.cwd || process.cwd();
	let overrideConfig = false;
	let { config: filePath } = options;
	if (filePath === false) return { configs: [{}] };
	if (typeof filePath === "string") {
		const stats = await fsStat(filePath);
		if (stats) {
			const resolved = path.resolve(filePath);
			if (stats.isFile()) {
				overrideConfig = true;
				filePath = resolved;
				cwd = path.dirname(filePath);
			} else if (stats.isDirectory()) cwd = resolved;
		}
	}
	const nativeTS = process.features.typescript || process.versions.bun || process.versions.deno;
	let { config, sources } = await loadConfig.async({
		sources: overrideConfig ? [{
			files: filePath,
			extensions: []
		}] : [{
			files: "tsdown.config",
			extensions: [
				"ts",
				"mts",
				"cts",
				"js",
				"mjs",
				"cjs",
				"json",
				""
			],
			parser: loaded || !nativeTS ? "auto" : async (filepath) => {
				const mod = await import(pathToFileURL(filepath).href);
				const config$1 = mod.default || mod;
				return config$1;
			}
		}, {
			files: "package.json",
			extensions: [],
			rewrite: (config$1) => config$1?.tsdown
		}],
		cwd,
		stopAt: workspace && path.dirname(workspace),
		defaults: {}
	}).finally(() => loaded = true);
	const file = sources[0];
	if (file) logger.info(`Using tsdown config: ${underline(file)}`);
	if (typeof config === "function") config = await config(options);
	config = toArray(config);
	if (config.length === 0) config.push({});
	return {
		configs: config,
		file
	};
}

//#endregion
//#region src/options/index.ts
const debug = Debug("tsdown:options");
const DEFAULT_EXCLUDE_WORKSPACE = [
	"**/node_modules/**",
	"**/dist/**",
	"**/test?(s)/**",
	"**/t?(e)mp/**"
];
async function resolveOptions(options) {
	const files = [];
	debug("options %O", options);
	debug("loading config file: %s", options.config);
	const { configs: rootConfigs, file } = await loadConfigFile(options);
	if (file) {
		files.push(file);
		debug("loaded root config file %s", file);
		debug("root configs %o", rootConfigs);
	} else debug("no root config file found");
	const configs = (await Promise.all(rootConfigs.map(async (rootConfig) => {
		const { configs: workspaceConfigs, files: workspaceFiles } = await resolveWorkspace(rootConfig, options);
		if (workspaceFiles) files.push(...workspaceFiles);
		return Promise.all(workspaceConfigs.filter((config) => !config.workspace || config.entry).map((config) => resolveConfig(config)));
	}))).flat();
	debug("resolved configs %O", configs);
	return {
		configs,
		files
	};
}
async function resolveWorkspace(config, options) {
	const normalized = {
		...config,
		...options
	};
	const rootCwd = normalized.cwd || process.cwd();
	let { workspace } = normalized;
	if (!workspace) return {
		configs: [normalized],
		files: []
	};
	if (workspace === true) workspace = {};
	else if (typeof workspace === "string" || Array.isArray(workspace)) workspace = { include: workspace };
	let { include: packages = "auto", exclude = DEFAULT_EXCLUDE_WORKSPACE, config: workspaceConfig } = workspace;
	if (packages === "auto") packages = (await glob({
		patterns: "**/package.json",
		ignore: exclude,
		cwd: rootCwd
	})).filter((file) => file !== "package.json").map((file) => path.resolve(rootCwd, file, ".."));
	else packages = (await glob({
		patterns: packages,
		ignore: exclude,
		cwd: rootCwd,
		onlyDirectories: true,
		absolute: true
	})).map((file) => path.resolve(file));
	if (packages.length === 0) throw new Error("No workspace packages found, please check your config");
	if (options.filter) {
		if (typeof options.filter === "string" && options.filter.length > 2 && options.filter[0] === "/" && options.filter.at(-1) === "/") options.filter = new RegExp(options.filter.slice(1, -1));
		packages = packages.filter((path$1) => {
			return typeof options.filter === "string" ? path$1.includes(options.filter) : Array.isArray(options.filter) ? options.filter.some((filter) => path$1.includes(filter)) : options.filter.test(path$1);
		});
		if (packages.length === 0) throw new Error("No packages matched the filters");
	}
	const files = [];
	const configs = (await Promise.all(packages.map(async (cwd) => {
		debug("loading workspace config %s", cwd);
		const { configs: configs$1, file } = await loadConfigFile({
			...options,
			config: workspaceConfig,
			cwd
		}, cwd);
		if (file) {
			debug("loaded workspace config file %s", file);
			files.push(file);
		} else debug("no workspace config file found in %s", cwd);
		return configs$1.map((config$1) => ({
			...normalized,
			cwd,
			...config$1
		}));
	}))).flat();
	return {
		configs,
		files
	};
}
async function resolveConfig(userConfig) {
	let { entry, format = ["es"], plugins = [], clean = true, silent = false, treeshake = true, platform = "node", outDir = "dist", sourcemap = false, dts, unused = false, watch = false, ignoreWatch = [], shims = false, skipNodeModulesBundle = false, publint: publint$1 = false, fromVite, alias, tsconfig, report = true, target, env = {}, copy: copy$1, publicDir, hash, cwd = process.cwd(), name, workspace, external, noExternal } = userConfig;
	outDir = path.resolve(cwd, outDir);
	clean = resolveClean(clean, outDir, cwd);
	const pkg = await readPackageJson(cwd);
	if (workspace) name ||= pkg?.name;
	entry = await resolveEntry(entry, cwd, name);
	if (dts == null) dts = !!(pkg?.types || pkg?.typings);
	target = resolveTarget(target, pkg, name);
	tsconfig = await resolveTsconfig(tsconfig, cwd, name);
	if (typeof external === "string") external = resolveRegex(external);
	if (typeof noExternal === "string") noExternal = resolveRegex(noExternal);
	if (publint$1 === true) publint$1 = {};
	if (publicDir) if (copy$1) throw new TypeError("`publicDir` is deprecated. Cannot be used with `copy`");
	else logger.warn(`${blue`publicDir`} is deprecated. Use ${blue`copy`} instead.`);
	if (fromVite) {
		const viteUserConfig = await loadViteConfig(fromVite === true ? "vite" : fromVite, cwd);
		if (viteUserConfig) {
			if (Array.isArray(alias)) throw new TypeError("Unsupported resolve.alias in Vite config. Use object instead of array");
			if (viteUserConfig.plugins) plugins = [viteUserConfig.plugins, plugins];
			const viteAlias = viteUserConfig.resolve?.alias;
			if (viteAlias && !Array.isArray(viteAlias)) alias = viteAlias;
		}
	}
	const config = {
		...userConfig,
		entry,
		plugins,
		format: normalizeFormat(format),
		target,
		outDir,
		clean,
		silent,
		treeshake,
		platform,
		sourcemap,
		dts: dts === true ? {} : dts,
		report: report === true ? {} : report,
		unused,
		watch,
		ignoreWatch,
		shims,
		skipNodeModulesBundle,
		publint: publint$1,
		alias,
		tsconfig,
		cwd,
		env,
		pkg,
		copy: publicDir || copy$1,
		hash: hash ?? true,
		name,
		external,
		noExternal
	};
	return config;
}
async function mergeUserOptions(defaults, user, args) {
	const userOutputOptions = typeof user === "function" ? await user(defaults, ...args) : user;
	return {
		...defaults,
		...userOutputOptions
	};
}

//#endregion
//#region src/index.ts
/**
* Build with tsdown.
*/
async function build(userOptions = {}) {
	if (typeof userOptions.silent === "boolean") logger.setSilent(userOptions.silent);
	const { configs, files: configFiles } = await resolveOptions(userOptions);
	let cleanPromise;
	const clean = () => {
		if (cleanPromise) return cleanPromise;
		return cleanPromise = cleanOutDir(configs);
	};
	logger.info("Build start");
	const rebuilds = await Promise.all(configs.map((options) => buildSingle(options, clean)));
	const cleanCbs = [];
	for (const [i, config] of configs.entries()) {
		const rebuild = rebuilds[i];
		if (!rebuild) continue;
		const watcher = await watchBuild(config, configFiles, rebuild, restart);
		cleanCbs.push(() => watcher.close());
	}
	if (cleanCbs.length) shortcuts(restart);
	async function restart() {
		for (const clean$1 of cleanCbs) await clean$1();
		build(userOptions);
	}
}
const dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(dirname$1, "..");
/**
* Build a single configuration, without watch and shortcuts features.
*
* Internal API, not for public use
*
* @private
* @param config Resolved options
*/
async function buildSingle(config, clean) {
	const { format: formats, dts, watch, onSuccess } = config;
	let onSuccessCleanup;
	const { hooks, context } = await createHooks$1(config);
	await rebuild(true);
	if (watch) return () => rebuild();
	async function rebuild(first) {
		const startTime = performance.now();
		await hooks.callHook("build:prepare", context);
		onSuccessCleanup?.();
		await clean();
		let hasErrors = false;
		const isMultiFormat = formats.length > 1;
		await Promise.all(formats.map(async (format) => {
			try {
				const buildOptions = await getBuildOptions(config, format, false, isMultiFormat);
				await hooks.callHook("build:before", {
					...context,
					buildOptions
				});
				await build$1(buildOptions);
				if (format === "cjs" && dts) await build$1(await getBuildOptions(config, format, true, isMultiFormat));
			} catch (error) {
				if (watch) {
					logger.error(error);
					hasErrors = true;
					return;
				}
				throw error;
			}
		}));
		if (hasErrors) return;
		await publint(config);
		await copy(config);
		await hooks.callHook("build:done", context);
		logger.success(prettyName(config.name), `${first ? "Build" : "Rebuild"} complete in ${green(`${Math.round(performance.now() - startTime)}ms`)}`);
		if (typeof onSuccess === "string") {
			const p = exec(onSuccess, [], { nodeOptions: {
				shell: true,
				stdio: "inherit"
			} });
			p.then(({ exitCode }) => {
				if (exitCode) process.exitCode = exitCode;
			});
			onSuccessCleanup = () => p.kill("SIGTERM");
		} else await onSuccess?.(config);
	}
}
async function getBuildOptions(config, format, cjsDts, isMultiFormat) {
	const { entry, external, plugins: userPlugins, outDir, platform, alias, treeshake, sourcemap, dts, minify, unused, target, define, shims, tsconfig, cwd, report, env, removeNodeProtocol, loader, name } = config;
	const plugins = [];
	if (removeNodeProtocol) plugins.push(NodeProtocolPlugin());
	if (config.pkg || config.skipNodeModulesBundle) plugins.push(ExternalPlugin(config));
	if (dts) {
		const { dts: dtsPlugin } = await import("rolldown-plugin-dts");
		const options = {
			tsconfig,
			...dts
		};
		if (format === "es") plugins.push(dtsPlugin(options));
		else if (cjsDts) plugins.push(dtsPlugin({
			...options,
			emitDtsOnly: true
		}));
	}
	if (!cjsDts) {
		if (unused) {
			const { Unused } = await import("unplugin-unused");
			plugins.push(Unused.rolldown(unused === true ? {} : unused));
		}
		if (target) plugins.push(RuntimeHelperCheckPlugin(target), await LightningCSSPlugin({ target }));
		plugins.push(ShebangPlugin(cwd, name, isMultiFormat));
	}
	if (report && !logger.silent) plugins.push(ReportPlugin(report, cwd, cjsDts, name, isMultiFormat));
	if (!cjsDts) plugins.push(userPlugins);
	const inputOptions = await mergeUserOptions({
		input: entry,
		cwd,
		external,
		resolve: {
			alias,
			tsconfigFilename: tsconfig || void 0
		},
		treeshake,
		platform,
		define: {
			...define,
			...Object.keys(env).reduce((acc, key) => {
				const value = JSON.stringify(env[key]);
				acc[`process.env.${key}`] = value;
				acc[`import.meta.env.${key}`] = value;
				return acc;
			}, Object.create(null))
		},
		plugins,
		inject: { ...shims && !cjsDts && getShimsInject(format, platform) },
		moduleTypes: loader
	}, config.inputOptions, [format]);
	const [entryFileNames, chunkFileNames] = resolveChunkFilename(config, inputOptions, format);
	const outputOptions = await mergeUserOptions({
		format: cjsDts ? "es" : format,
		name: config.globalName,
		sourcemap,
		dir: outDir,
		target,
		minify,
		entryFileNames,
		chunkFileNames
	}, config.outputOptions, [format]);
	return {
		...inputOptions,
		output: outputOptions
	};
}

//#endregion
export { build, buildSingle, defineConfig, logger, pkgRoot };