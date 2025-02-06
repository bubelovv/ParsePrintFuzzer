import * as fc from "fast-check";
import {eqExpressions, getAstFactory, prettyPrint, getParser} from "./imports";
import {expression} from "./util";

describe("Tact Pretty Printer Tests", () => {
    const {parseExpression} = getParser(getAstFactory(), "new");

    it("prettyPrint should preserve AST semantics on re-parse", () => {
        fc.assert(
            fc.property(expression(4), (generatedAst) => {
                const prettyGenerated = prettyPrint(generatedAst);
                const parsedAst = parseExpression(prettyGenerated);
                const prettyParsed = prettyPrint(parsedAst);

                expect(prettyGenerated).toBe(prettyParsed);
                expect(eqExpressions(generatedAst, parsedAst)).toBe(true);
            }), {numRuns: 1000}
        );
    });
});
