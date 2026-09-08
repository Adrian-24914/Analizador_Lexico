import { tokenizeRegex } from './2-validator';

const PRECEDENCE: Record<string, number> = {
    '*': 3,
    '+': 3,
    '?': 3,
    '.': 2,
    '|': 1,
};

const OPERATORS = new Set(['*', '+', '?', '.', '|']);

/**
 * Inserta el operador explícito '.' donde exista una concatenación implícita.
 */
export function insertExplicitConcat(regex: string): string {
    const tokens = tokenizeRegex(regex);
    const result: string[] = [];

    for (const [index, token] of tokens.entries()) {
        const next = tokens[index + 1];
        result.push(token);

        if (next && token !== '|' && token !== '(' && !['|', ')', '*', '+', '?'].includes(next)) {
            result.push('.');
        }
    }

    return result.join('');
}

/**
 * Algoritmo Shunting-Yard para convertir regex infix a notación postfix.
 */
export function regexToPostfix(regex: string): string {
    const output: string[] = [];
    const stack: string[] = [];

    for (const token of tokenizeRegex(insertExplicitConcat(regex))) {

        // Si es un operando
        if (!OPERATORS.has(token) && token !== '(' && token !== ')') {
        output.push(token);
        continue;
        }

        // Si es un paréntesis de apertura
        if (token === '(') {
        stack.push(token);
        continue;
        }

        // Si es un paréntesis de cierre
        if (token === ')') {
        while (stack.at(-1) !== '(') {
            output.push(stack.pop()!);
        }

        stack.pop(); // Elimina '('
        continue;
        }

        // Si es un operador, verifica la precedencia 
        while (
        stack.at(-1) !== undefined &&
        stack.at(-1) !== '(' &&
        PRECEDENCE[stack.at(-1)!] >= PRECEDENCE[token]
        ) {
        output.push(stack.pop()!);
        }
        stack.push(token);
    }

    return output.concat(stack.reverse()).join('');
}
