import * as fs from 'fs';
import { NFA, EPSILON } from './4-thompson';

/**
 * Genera el string en formato DOT (Graphviz) a partir de un NFA.
 */
export function nfaToDot(nfa: NFA): string {
    const lines: string[] = [];

    lines.push('digraph NFA {');
    // Orientación horizontal (de izquierda a derecha)
    lines.push('    rankdir = LR;');
    // Forma por defecto para todos los nodos
    lines.push('    node [shape = circle];');
    lines.push('');

    // 1. Nodo invisible para la flecha de inicio
    lines.push('    // Estado inicial');
    lines.push('    __start [shape = none, label = ""];');
    lines.push(`    __start -> ${nfa.start.id};`);
    lines.push('');

    // 2. Estado(s) de aceptación con doble círculo
    lines.push('    // Estado de aceptación');
    lines.push(`    ${nfa.accept.id} [shape = doublecircle];`);
    lines.push('');

    // 3. Transiciones
    lines.push('    // Transiciones');
    
    // Si ya tienes la lista nfa.states, la iteramos directamente;
    // de lo contrario, se puede recorrer con un BFS/DFS.
    for (const state of nfa.states) {
        for (const transition of state.transitions) {
            // Si el símbolo es null, se representa con ε (o tu constante EPSILON)
            const label = transition.symbol === null ? EPSILON : escapeDotLabel(transition.symbol);
            lines.push(`    ${state.id} -> ${transition.to.id} [label = "${label}"];`);
        }
    }

    lines.push('}');
    return lines.join('\n');
}

/**
 * Escapa caracteres especiales que puedan romper la sintaxis DOT (comillas, barras, etc.)
 */
function escapeDotLabel(symbol: string): string {
    if (symbol === '"') return '\\"';
    if (symbol === '\\') return '\\\\';
    return symbol;
}

/**
 * Guarda el NFA en un archivo .dot en disco (Node.js)
 */
export function exportNfaToDotFile(nfa: NFA, filePath: string): void {
    const dotContent = nfaToDot(nfa);
    fs.writeFileSync(filePath, dotContent, 'utf-8');
}