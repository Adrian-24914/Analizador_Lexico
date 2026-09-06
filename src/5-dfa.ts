import type { ElementDefinition, Core } from 'cytoscape'
import cytoscape from 'cytoscape'

import type { NFA, State } from './4-thompson'

export interface DFAState {
    id: number
    nfaStates: State[]
    accepting: boolean
    transitions: Map<string, DFAState>
}

export interface DFA {
    start: DFAState
    states: DFAState[]
    alphabet: string[]
}

/**
 * Calcula la clausura-épsilon de un conjunto de estados del AFN
 * (idéntico en espíritu a la función homónima de nfa-simulator.ts,
 * pero recibe y devuelve un Set para poder usarse como clave de caché).
 */
function epsilonClosure(states: State[]): Set<State> {
    const closure = new Set(states)
    const pending = [...states]

    while (pending.length > 0) {
        const state = pending.pop()!

        for (const transition of state.transitions) {
            if (transition.symbol === null && !closure.has(transition.to)) {
                closure.add(transition.to)
                pending.push(transition.to)
            }
        }
    }

    return closure
}

/**
 * Devuelve los estados alcanzables desde un conjunto de estados del AFN
 * al consumir un símbolo (sin aplicar todavía la clausura-épsilon).
 */
function move(states: Set<State>, symbol: string): State[] {
    const result: State[] = []

    for (const state of states) {
        for (const transition of state.transitions) {
            if (transition.symbol === symbol) {
                result.push(transition.to)
            }
        }
    }

    return result
}

/**
 * Extrae el alfabeto del AFN: todos los símbolos distintos que
 * etiquetan alguna transición (se ignoran las transiciones épsilon).
 */
function nfaAlphabet(nfa: NFA): string[] {
    const symbols = new Set<string>()

    for (const state of nfa.states) {
        for (const transition of state.transitions) {
            if (transition.symbol !== null) {
                symbols.add(transition.symbol)
            }
        }
    }

    return [...symbols].sort()
}

/**
 * Clave canónica para un conjunto de estados del AFN, usada para
 * detectar cuándo dos subconjuntos ya generaron el mismo estado del AFD.
 */
function subsetKey(states: Set<State>): string {
    return [...states]
        .map(state => state.id)
        .sort((a, b) => a - b)
        .join(',')
}

/**
 * Construcción por subconjuntos (subset construction): convierte un
 * AFN en su AFD equivalente. Cada estado del AFD representa un
 * conjunto de estados del AFN en los que se podría estar
 * simultáneamente.
 */
export function subsetConstruction(nfa: NFA): DFA {
    const alphabet = nfaAlphabet(nfa)

    const dfaStates: DFAState[] = []
    const seen = new Map<string, DFAState>()

    // FUNCIÓN AUXILIAR: obtiene el estado del AFD para un conjunto de
    // estados del AFN, creándolo si todavía no existe
    const getOrCreate = (nfaStates: Set<State>): DFAState => {
        const key = subsetKey(nfaStates)
        const existing = seen.get(key)

        if (existing) {
            return existing
        }

        const dfaState: DFAState = {
            id: dfaStates.length,
            nfaStates: [...nfaStates].sort((a, b) => a.id - b.id),
            accepting: nfaStates.has(nfa.accept),
            transitions: new Map(),
        }

        seen.set(key, dfaState)
        dfaStates.push(dfaState)

        return dfaState
    }

    const start = getOrCreate(epsilonClosure([nfa.start]))

    // Algoritmo de la lista de pendientes (worklist): mientras haya
    // estados del AFD sin procesar, se calcula a dónde se llega con
    // cada símbolo del alfabeto y se generan (o reutilizan) los
    // estados del AFD correspondientes.
    const pending = [start]

    while (pending.length > 0) {
        const current = pending.pop()!
        const currentNFAStates = new Set(current.nfaStates)

        for (const symbol of alphabet) {
            const reachable = move(currentNFAStates, symbol)

            if (reachable.length === 0) {
                continue
            }

            const closure = epsilonClosure(reachable)
            const key = subsetKey(closure)
            const isNew = !seen.has(key)

            const target = getOrCreate(closure)
            current.transitions.set(symbol, target)

            if (isNew) {
                pending.push(target)
            }
        }
    }

    return { start, states: dfaStates, alphabet }
}

/**
 * Simula una cadena sobre el AFD. A diferencia del AFN, en cada paso
 * hay a lo más un estado activo: si no existe transición para el
 * símbolo actual, la cadena se rechaza de inmediato (estado de error
 * implícito).
 */
export function simulateDFA(dfa: DFA, value: string): boolean {
    let current = dfa.start

    for (const symbol of value) {
        const next = current.transitions.get(symbol)

        if (!next) {
            return false
        }

        current = next
    }

    return current.accepting
}

/**
 * Etiqueta corta de un estado del AFD, la que se muestra dentro del
 * círculo (D0, D1, D2...). El subconjunto de estados del AFN que
 * representa es información importante pero demasiado larga para
 * caber en un nodo, así que se muestra aparte, en la leyenda.
 */
function dfaShortLabel(state: DFAState): string {
    return `D${state.id}`
}

/**
 * Etiqueta larga de un estado del AFD: el subconjunto de estados del
 * AFN que representa, p. ej. "{q0,q1,q3}". Se usa solo en la leyenda,
 * nunca dentro del círculo del grafo.
 */
function dfaSubsetLabel(state: DFAState): string {
    return `{${state.nfaStates.map(s => `q${s.id}`).join(',')}}`
}

/**
 * Agrega un valor a un arreglo dentro de un Map, creando el arreglo
 * si todavía no existe para esa llave.
 */
function pushToMapArray<K, V>(map: Map<K, V[]>, key: K, value: V): void {
    const existing = map.get(key)

    if (existing) {
        existing.push(value)
    } else {
        map.set(key, [value])
    }
}

/**
 * Calcula la posición (x, y) de cada estado del AFD organizándolos
 * en niveles horizontales según su distancia (en número de
 * transiciones) desde el estado inicial. Dentro de cada nivel, los
 * estados se reordenan con una heurística de barycentro (promedio de
 * la posición de sus vecinos) para reducir cuántas líneas se cruzan
 * entre sí, igual que en un diagrama por capas (estilo Sugiyama).
 */
function computeLayeredPositions(dfa: DFA): Map<number, { x: number; y: number }> {
    const HORIZONTAL_SPACING = 130
    const VERTICAL_SPACING = 140

    // Nivel de cada estado = distancia más corta desde el inicio
    const level = new Map<number, number>([[dfa.start.id, 0]])
    const queue = [dfa.start]

    while (queue.length > 0) {
        const current = queue.shift()!
        const currentLevel = level.get(current.id)!

        for (const target of current.transitions.values()) {
            if (!level.has(target.id)) {
                level.set(target.id, currentLevel + 1)
                queue.push(target)
            }
        }
    }

    const levels: DFAState[][] = []

    for (const state of dfa.states) {
        const lvl = level.get(state.id) ?? 0
        const bucket = levels[lvl] ?? (levels[lvl] = [])
        bucket.push(state)
    }

    const orderIndex = new Map<number, number>()
    const refreshOrderIndex = (): void => {
        for (const levelStates of levels) {
            levelStates.forEach((state, index) => orderIndex.set(state.id, index))
        }
    }
    refreshOrderIndex()

    // Vecinos hacia adelante y hacia atrás (sin contar auto-transiciones),
    // usados por la heurística de barycentro
    const predecessors = new Map<number, DFAState[]>()
    const successors = new Map<number, DFAState[]>()

    for (const state of dfa.states) {
        for (const target of state.transitions.values()) {
            if (target.id === state.id) {
                continue
            }

            pushToMapArray(successors, state.id, target)
            pushToMapArray(predecessors, target.id, state)
        }
    }

    const barycenter = (state: DFAState, neighbors: DFAState[] | undefined): number => {
        if (!neighbors || neighbors.length === 0) {
            return orderIndex.get(state.id)!
        }

        const sum = neighbors.reduce((total, neighbor) => total + orderIndex.get(neighbor.id)!, 0)
        return sum / neighbors.length
    }

    // Varias pasadas alternando el sentido (de arriba hacia abajo y
    // viceversa) para que el orden converja a algo razonable
    const PASSES = 4

    for (let pass = 0; pass < PASSES; pass++) {
        const goingDown = pass % 2 === 0
        const neighborsOf = goingDown ? predecessors : successors
        const range = goingDown
            ? levels.map((_, index) => index).filter(index => index > 0)
            : levels.map((_, index) => index).reverse().filter(index => index < levels.length - 1)

        for (const levelIndex of range) {
            const reordered = levels[levelIndex]!
                .map(state => ({ state, key: barycenter(state, neighborsOf.get(state.id)) }))
                .sort((a, b) => a.key - b.key)
                .map(entry => entry.state)

            levels[levelIndex] = reordered
        }

        refreshOrderIndex()
    }

    // Convierte niveles + orden dentro del nivel en coordenadas (x, y),
    // centrando cada nivel horizontalmente
    const positions = new Map<number, { x: number; y: number }>()

    levels.forEach((levelStates, levelIndex) => {
        const width = (levelStates.length - 1) * HORIZONTAL_SPACING

        levelStates.forEach((state, index) => {
            positions.set(state.id, {
                x: index * HORIZONTAL_SPACING - width / 2,
                y: levelIndex * VERTICAL_SPACING,
            })
        })
    })

    return positions
}

export function dfaToCytoscapeElements(
    dfa: DFA,
    positions: Map<number, { x: number; y: number }>,
): ElementDefinition[] {
    const elements: ElementDefinition[] = []

    // Nodo auxiliar para indicar el estado inicial
    elements.push({
        data: {
            id: 'initial-arrow',
            label: '',
        },
        classes: 'initial-arrow',
    })

    // Estados del AFD, ya con su posición fija calculada por niveles
    for (const state of dfa.states) {
        const classes: string[] = []

        if (state.id === dfa.start.id) {
            classes.push('start-state')
        }

        if (state.accepting) {
            classes.push('accept-state')
        }

        elements.push({
            data: {
                id: `d${state.id}`,
                label: dfaShortLabel(state),
            },
            position: positions.get(state.id),
            classes: classes.join(' '),
        })
    }

    // Flecha que indica el estado inicial
    elements.push({
        data: {
            id: 'initial-edge',
            source: 'initial-arrow',
            target: `d${dfa.start.id}`,
            label: '',
        },
    })

    // Transiciones del AFD, agrupando en una sola arista los símbolos
    // distintos que llevan al mismo estado destino (p. ej. "a,b")
    let edgeId = 0

    for (const state of dfa.states) {
        const bySource = new Map<DFAState, string[]>()

        for (const [symbol, target] of state.transitions) {
            const symbols = bySource.get(target) ?? []
            symbols.push(symbol)
            bySource.set(target, symbols)
        }

        for (const [target, symbols] of bySource) {
            const isSelfLoop = target.id === state.id

            elements.push({
                data: {
                    id: `e${edgeId++}`,
                    source: `d${state.id}`,
                    target: `d${target.id}`,
                    label: symbols.join(','),
                },
                classes: isSelfLoop ? 'self-loop' : '',
            })
        }
    }

    return elements
}

/**
 * Pinta, dentro de container, la lista que traduce cada nombre corto
 * del AFD (D0, D1...) al subconjunto de estados del AFN que
 * representa. Se usa junto con renderDFA para no perder esa
 * información aunque el grafo ya no la muestre dentro de los nodos.
 */
export function renderDFALegend(dfa: DFA, container: HTMLElement): void {
    container.replaceChildren()

    const list = document.createElement('ul')
    list.className = 'dfa-legend'

    for (const state of dfa.states) {
        const item = document.createElement('li')
        const marks = [
            state.id === dfa.start.id ? 'inicial' : null,
            state.accepting ? 'aceptación' : null,
        ].filter(Boolean)

        item.textContent = `${dfaShortLabel(state)} = ${dfaSubsetLabel(state)}`
            + (marks.length > 0 ? ` (${marks.join(', ')})` : '')

        list.append(item)
    }

    container.append(list)
}

export function renderDFA(dfa: DFA, container: HTMLElement): Core {
    const positions = computeLayeredPositions(dfa)

    const graph = cytoscape({
        container,

        elements: dfaToCytoscapeElements(dfa, positions),

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
                    'text-background-padding': '2',
                },
            },

            {
                selector: 'edge.self-loop',
                style: {
                    'loop-direction': '-90deg',
                    'loop-sweep': '45deg',
                    'control-point-step-size': 40,
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
            name: 'preset',
        },

        minZoom: 0.3,
        maxZoom: 3,
    })

    const startPosition = graph.getElementById(`d${dfa.start.id}`).position()
    graph.getElementById('initial-arrow').position({
        x: startPosition.x - 80,
        y: startPosition.y,
    })
    graph.fit(graph.elements(), 30)

    return graph
}