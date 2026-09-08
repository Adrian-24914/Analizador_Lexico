export function tokenizeRegex(regex: string): string[] {
    return regex.match(/\\[()*+?.|]|./gu) ?? [];
}

/**
 * Valida si los paréntesis de una expresión regular están balanceados.
 */
export function isBalanced(regex: string): boolean {
    const stack: string[] = [];

    for (const char of tokenizeRegex(regex)) {
        if (char === '(') {
        stack.push(char);
        } else if (char === ')') {
        if (stack.length === 0) {
            return false;
        }
        stack.pop();
        }
    }

    return stack.length === 0;
}
