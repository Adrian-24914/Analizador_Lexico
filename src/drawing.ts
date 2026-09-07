import { instance } from '@viz-js/viz';
import type { NFA } from './4-thompson';
import { EPSILON } from './4-thompson';
import type { DFA } from './5-subsets';

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
            const label = transition.symbol === null ? EPSILON : escapeDotLabel(transition.symbol);
            lines.push(`    ${state.id} -> ${transition.to.id} [label = "${label}"];`);
        }
    }

    lines.push('}');
    return lines.join('\n');
}

export async function renderNFA(nfa: NFA, container: HTMLElement): Promise<void> {
    container.replaceChildren((await viz).renderSVGElement(nfaToDot(nfa)));
}

export async function renderDFA(dfa: DFA, container: HTMLElement): Promise<void> {
    container.replaceChildren((await viz).renderSVGElement(dfaToDot(dfa)));
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
 * Convierte un autómata finito determinista (DFA) a formato Graphviz DOT.
 */
export function dfaToDot(dfa: DFA): string {
    const lines: string[] = [
        'digraph DFA {',
        '    rankdir = LR;',
        '    node [shape = circle];',
        '',
        '    // Entrada al estado inicial',
        '    __start [shape = none, label = ""];',
        `    __start -> D${dfa.start.id};`,
        '',
        '    // Definición de nodos'
    ];

    for (const state of dfa.states) {
        const shape = state.isAccept ? 'doublecircle' : 'circle';

        lines.push(`    D${state.id} [shape = ${shape}];`);
    }

    lines.push('', '    // Transiciones');

    for (const state of dfa.states) {
        for (const [symbol, target] of Object.entries(state.transitions)) {
            lines.push(`    D${state.id} -> D${target.id} [label = "${escapeDotLabel(symbol)}"];`);
        }
    }

    lines.push('}');
    return lines.join('\n');
}
