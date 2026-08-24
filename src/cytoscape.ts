import type { ElementDefinition,  Core } from 'cytoscape';
import cytoscape from 'cytoscape';

import { NFA, EPSILON} from './thompson';

export function nfaToCytoscapeElements(
    nfa: NFA,
): ElementDefinition[] {
    const elements: ElementDefinition[] = [];

    // Nodo auxiliar para indicar el estado inicial
    elements.push({
        data: {
        id: 'initial-arrow',
        label: '',
        },
        classes: 'initial-arrow',
    });

    // Estados del AFN
    for (const state of nfa.states) {
        const classes: string[] = [];

        if (state.id === nfa.start.id) {
        classes.push('start-state');
        }

        if (state.id === nfa.accept.id) {
        classes.push('accept-state');
        }

        elements.push({
        data: {
            id: `q${state.id}`,
            label: `q${state.id}`,
        },
        classes: classes.join(' '),
        });
    }

    // Flecha que indica el estado inicial
    elements.push({
        data: {
        id: 'initial-edge',
        source: 'initial-arrow',
        target: `q${nfa.start.id}`,
        label: '',
        },
    });

    // Transiciones del AFN
    let edgeId = 0;

    for (const state of nfa.states) {
        for (const transition of state.transitions) {
        elements.push({
            data: {
            id: `e${edgeId++}`,
            source: `q${state.id}`,
            target: `q${transition.to.id}`,
            label: transition.symbol ?? EPSILON,
            },
        });
        }
    }

    return elements;
}


export function renderNFA(
    nfa: NFA,
    container: HTMLElement,
): Core {
    return cytoscape({
        container,

        elements: nfaToCytoscapeElements(nfa),

        style: [
        {
            selector: 'node',
            style: {
            width: 55,
            height: 55,
            shape: 'ellipse',

            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',

            'background-color': '#ffffff',
            'border-color': '#334155',
            'border-width': 2,

            color: '#0f172a',
            'font-size': 14,
            },
        },

        {
            selector: 'node.start-state',
            style: {
            'background-color': '#ffffff',
            'border-color': '#334155',
            },
        },

        {
            selector: 'node.accept-state',
            style: {
            'background-color': '#ffffff',
            'border-color': '#334155',
            'border-width': 12,
            },
        },

        {
            selector: 'node.initial-arrow',
            style: {
            width: 1,
            height: 1,
            opacity: 0,
            label: '',
            },
        },

        {
            selector: 'edge',
            style: {
            width: 2,

            label: 'data(label)',
            'font-size': 13,
            color: '#247e57',

            'line-color': '#198d1b',
            'target-arrow-color': '#198d1b',
            'target-arrow-shape': 'triangle',

            'curve-style': 'bezier',

            'text-background-color': '#ffffff',
            'text-background-opacity': 1,
            'text-background-padding': '1',
            },
        },

        {
            selector: 'edge[label = "☻"]',
            style: {
            'line-style': 'dashed',
            'line-color': '#b6b5b7',
            'target-arrow-color': '#b6b5b7',
            color: '#b6b5b7',
            },
        },

        {
            selector: ':selected',
            style: {
            'overlay-color': '#3b82f6',
            'overlay-opacity': 0.15,
            'overlay-padding': 8,
            },
        },
        ],

        layout: {
            name: 'breadthfirst',
            directed: true,
            roots: ['#initial-arrow'],
            circle: false,
            spacingFactor: 1.5,
            padding: 30,
            },

            minZoom: 0.3,
            maxZoom: 3,
            wheelSensitivity: 0.2,
    });
}


