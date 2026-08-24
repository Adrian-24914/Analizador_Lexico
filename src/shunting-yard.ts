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
    return regex.replace(/([^|(])(?=[^|)*+?])/g, '$1.');
}

/**
 * Algoritmo Shunting-Yard para convertir regex infix a notación postfix.
 */
export function regexToPostfix(regex: string): string {
    const output: string[] = [];
    const stack: string[] = [];

    for (const token of insertExplicitConcat(regex)) {

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