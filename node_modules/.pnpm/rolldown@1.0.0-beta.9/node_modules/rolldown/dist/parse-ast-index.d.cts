import { ParseResult, ParserOptions } from "./shared/binding.d-zZoPrk0_.cjs";
import { Program } from "@oxc-project/types";

//#region src/parse-ast-index.d.ts
declare function parseAst(sourceText: string, options?: ParserOptions | undefined | null, filename?: string): Program;
declare function parseAstAsync(sourceText: string, options?: ParserOptions | undefined | null, filename?: string): Promise<Program>;

//#endregion
export { ParseResult, ParserOptions, parseAst, parseAstAsync };