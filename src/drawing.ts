import { instance } from '@viz-js/viz';
import type { NFA } from './4-thompson';

const viz = instance();

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

    // Nodo invisible para la flecha de inicio
    lines.push('    // Estado inicial');
    lines.push('    __start [shape = none, label = ""];');
    lines.push(`    __start -> ${nfa.start.id};`);
    lines.push('');

    // Estado de aceptación con doble círculo
    lines.push('    // Estado de aceptación');
    lines.push(`    ${nfa.accept.id} [shape = doublecircle];`);
    lines.push('');

    // Transiciones
    lines.push('    // Transiciones');

    for (const state of nfa.states) {
        for (const transition of state.transitions) {
            const label = transition.symbol === null ? 'ε' : escapeDotLabel(transition.symbol);
            lines.push(`    ${state.id} -> ${transition.to.id} [label = "${label}"];`);
        }
    }

    lines.push('}');
    return lines.join('\n');
}

export async function renderNFA(nfa: NFA, container: HTMLElement): Promise<void> {
    container.replaceChildren((await viz).renderSVGElement(nfaToDot(nfa)));
}

/**
 * Escapa caracteres especiales que puedan romper la sintaxis DOT (comillas, barras, etc.)
 */
function escapeDotLabel(symbol: string): string {
    if (symbol === '"') return '\\"';
    if (symbol === '\\') return '\\\\';
    return symbol;
}
