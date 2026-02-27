import "./shared/binding.d-zZoPrk0_.cjs";
import { MaybePromise, Plugin } from "./shared/define-config.d-D8GT-e45.cjs";

//#region src/plugin/parallel-plugin-implementation.d.ts
type ParallelPluginImplementation = Plugin;
type Context = {
	/**
	* Thread number
	*/
	threadNumber: number
};
declare function defineParallelPluginImplementation<Options>(plugin: (Options: Options, context: Context) => MaybePromise<ParallelPluginImplementation>): (Options: Options, context: Context) => MaybePromise<ParallelPluginImplementation>;

//#endregion
export { Context, ParallelPluginImplementation, defineParallelPluginImplementation };