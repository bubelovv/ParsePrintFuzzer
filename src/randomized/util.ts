import * as fc from "fast-check";
import {
    AstBinaryOperation,
    AstExpression,
    AstUnaryOperation,
    dummySrcInfo,
    SrcInfo,
    AstNumber,
    AstBoolean,
    AstNull,
    AstString,
    AstOpUnary,
    AstOpBinary,
    AstConditional,
    AstId,
    AstInitOf,
    AstFieldAccess,
    AstStaticCall,
    AstMethodCall,
    AstStructFieldInitializer,
    AstStructInstance,
} from "./imports";

function isAstEqual(ast1: AstExpression, ast2: AstExpression): boolean {
    const excludedKeys = ['id', 'loc'];
    const filterKeys = (key: string) => !excludedKeys.includes(key);

    function deepCompare(node1: unknown, node2: unknown): boolean {
        if (node1 === node2) return true;

        if (typeof node1 !== typeof node2) return false;
        if (typeof node1 !== "object" || typeof node2 !== "object") return false;
        if (node1 === null || node2 === null) return false;

        const keys1 = Object.keys(node1).filter(filterKeys);
        const keys2 = Object.keys(node2).filter(filterKeys);

        if (keys1.length !== keys2.length) return false;

        return keys1.every((key) => deepCompare(
            (node1 as Record<string, unknown>)[key],
            (node2 as Record<string, unknown>)[key])
        );
    }

    return deepCompare(ast1, ast2);
}

function completeAstNode<T>(
    generator: fc.Arbitrary<T>,
): fc.Arbitrary<T & { id: number; loc: SrcInfo }> {
    return generator.map((i) => ({
        ...i,
        id: 0,
        loc: dummySrcInfo,
    }));
}

const BINARY_OPS: AstBinaryOperation[] = [
    "+",
    "-",
    "*",
    "/",
    "!=",
    ">",
    "<",
    ">=",
    "<=",
    "==",
    "&&",
    "||",
    "%",
    "<<",
    ">>",
    "&",
    "|",
    "^"
];

const UNARY_OPS: AstUnaryOperation[] = ["+", "-", "!", "!!", "~"];

const RESERVED_WORDS: string[] = [
    "fun",
    "let",
    "return",
    "receive",
    "extend",
    "external",
    "native",
    "primitive",
    "public",
    "null",
    "if",
    "else",
    "while",
    "repeat",
    "do",
    "until",
    "try",
    "catch",
    "foreach",
    "as",
    "map",
    "mutates",
    "extends",
    "import",
    "with",
    "trait",
    "initOf",
    "override",
    "abstract",
    "virtual",
    "inline",
    "const",
];

const astNumber = (): fc.Arbitrary<AstNumber> =>
    completeAstNode(fc.record({
        kind: fc.constant("number"),
        base: fc.constantFrom(2, 8, 10, 16),
        value: fc.bigInt().filter((n) => n > -1),
    }));

const astBoolean = (): fc.Arbitrary<AstBoolean> =>
    completeAstNode(fc.record({
        kind: fc.constant("boolean"),
        value: fc.boolean(),
    }));

const astNull = (): fc.Arbitrary<AstNull> =>
    completeAstNode(fc.record({
        kind: fc.constant("null"),
    }));

const astString = (): fc.Arbitrary<AstString> =>
    completeAstNode(fc.record({
        kind: fc.constant("string"),
        value: fc.stringMatching(/^[A-Z][A-Za-z0-9_]*$/),
    }));

const astOpUnary = (
    operand: fc.Arbitrary<AstExpression>
): fc.Arbitrary<AstOpUnary> =>
    completeAstNode(fc.record({
        kind: fc.constant("op_unary"),
        op: fc.constantFrom(...UNARY_OPS),
        operand,
    }));

const astOpBinary = (
    left: fc.Arbitrary<AstExpression>,
    right: fc.Arbitrary<AstExpression>,
): fc.Arbitrary<AstOpBinary> =>
    completeAstNode(fc.record({
        kind: fc.constant("op_binary"),
        op: fc.constantFrom(...BINARY_OPS),
        left,
        right,
    }));

const astConditional = (
    condition: fc.Arbitrary<AstExpression>,
    thenBranch: fc.Arbitrary<AstExpression>,
    elseBranch: fc.Arbitrary<AstExpression>,
): fc.Arbitrary<AstConditional> =>
    completeAstNode(fc.record({
        kind: fc.constant("conditional"),
        condition,
        thenBranch,
        elseBranch,
    }));

const astId = (): fc.Arbitrary<AstId> =>
    completeAstNode(fc.record({
        kind: fc.constant("id"),
        text: fc.stringMatching(/^[A-Z][A-Za-z0-9_]*$/).filter(t => !RESERVED_WORDS.includes(t)),
    }));

const astInitOf = (
    arg: fc.Arbitrary<AstExpression>
): fc.Arbitrary<AstInitOf> =>
    completeAstNode(fc.record({
        kind: fc.constant("init_of"),
        contract: astId(),
        args: fc.array(arg),
    }));

const astMethodCall = (
    self: fc.Arbitrary<AstExpression>,
    arg: fc.Arbitrary<AstExpression>,
): fc.Arbitrary<AstMethodCall> =>
    completeAstNode(fc.record({
        kind: fc.constant("method_call"),
        self,
        method: astId(),
        args: fc.array(arg),
    }));

const astFieldAccess = (
    aggregate: fc.Arbitrary<AstExpression>
): fc.Arbitrary<AstFieldAccess> =>
    completeAstNode(fc.record({
        kind: fc.constant("field_access"),
        aggregate,
        field: astId(),
    }));

const astStaticCall = (
    arg: fc.Arbitrary<AstExpression>
): fc.Arbitrary<AstStaticCall> =>
    completeAstNode(fc.record({
        kind: fc.constant("static_call"),
        args: fc.array(arg),
        function: astId(),
    }));

const astStructInstance = (
    arg: fc.Arbitrary<AstStructFieldInitializer>
): fc.Arbitrary<AstStructInstance> =>
    completeAstNode(fc.record({
        kind: fc.constant("struct_instance"),
        type: astId(),
        args: fc.array(arg),
    }));

const astStructFieldInitializer = (
    initializer: fc.Arbitrary<AstExpression>
): fc.Arbitrary<AstStructFieldInitializer> =>
    completeAstNode(fc.record({
        kind: fc.constant("struct_field_initializer"),
        field: astId(),
        initializer,
    }));

const astLiteral = (): fc.Arbitrary<AstExpression> => fc.oneof(
    astNumber(),
    astBoolean(),
    astNull(),
    astString()
)

const astExpression = (depth: number): fc.Arbitrary<AstExpression> => {
    const expr = () => expression(depth - 1);

    return fc.oneof(
        astLiteral(),
        astInitOf(expr()),
        astOpUnary(expr()),
        astOpBinary(expr(), expr()),
        astConditional(expr(), expr(), expr()),

        astMethodCall(expr(), expr()),
        astFieldAccess(expr()),
        astStaticCall(expr()),
        astStructInstance(astStructFieldInitializer(expr())),
    )
}

const expression = (depth: number): fc.Arbitrary<AstExpression> => {
    return fc.memo(n => {
        if (n <= 1) return astLiteral();
        return astExpression(depth);
    })(depth)
}

export {isAstEqual, expression}
