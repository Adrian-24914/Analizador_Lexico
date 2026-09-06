
export const EPSILON = '☻'


// Represetación de la transicion 
// de un estado a otro con un simbolo
export interface Transition {
    symbol: string | null
    to: State
}

// Represetación de un estado en el AFN
// con un id unico y una lista de transiciones
export interface State {
    id: number
    transitions: Transition[]
}

// Represetación de un AFN con un estado inicial, 
// un estado de aceptación y una lista de estados
export interface NFA {
    start: State
    accept: State
    states: State[]
}

// Represetación de un fragmento de AFN con un estado 
// inicial y un estado de aceptación
interface Fragment {
    start: State
    accept: State
}

function renumberFromStart(start: State): State[] {
    const orderedStates = [start]
    const visited = new Set(orderedStates)

    for (let index = 0; index < orderedStates.length; index++) {
        for (const transition of orderedStates[index]!.transitions) {
            if (!visited.has(transition.to)) {
                visited.add(transition.to)
                orderedStates.push(transition.to)
            }
        }
    }

    orderedStates.forEach((state, index) => {
        state.id = index
    })

    return orderedStates
}

export function postfixToNFA(postfix: string): NFA {
    const fragments: Fragment[] = []

    let nextId = 0

    // FUNCIÓN AUXILIAR: Crea un nuevo estado y lo agrega a la lista de estado
    const createState = (): State => {
        const state: State = {
        id: nextId++,
        transitions: [],
        }

        return state;
    }

    // FUNCIÓN AUXILIAR: Agrega una transición de un estado a otro
    const addTransition = (
        from: State,
        to: State,
        symbol: string | null,
    ): void => {
        from.transitions.push({ symbol, to });
    }

    // FUNCIÓN AUXILIAR: Saca un fragmento de la pila 
    // y lanza un error si la pila está vacía.
    const popFragment = (): Fragment => {
        const fragment = fragments.pop();

        if (!fragment) {
        throw new Error('Expresión postfija inválida');
        }

        return fragment;
    }

    for (const token of postfix) {
        switch (token) {
        case '.': {
            const right = popFragment()
            const left = popFragment()

            addTransition(left.accept, right.start, null);

            fragments.push({
            start: left.start,
            accept: right.accept,
            })

            break
        }

        case '|': {
            const right = popFragment()
            const left = popFragment()

            const start = createState()
            const accept = createState()

            addTransition(start, left.start, null)
            addTransition(start, right.start, null)

            addTransition(left.accept, accept, null)
            addTransition(right.accept, accept, null)

            fragments.push({ start, accept })
            break
        }

        case '*': {
            const fragment = popFragment();

            const start = createState();
            const accept = createState();

            addTransition(start, fragment.start, null);
            addTransition(start, accept, null);

            addTransition(fragment.accept, fragment.start, null);
            addTransition(fragment.accept, accept, null);

            fragments.push({ start, accept });
            break
        }

        case '+': {
            const fragment = popFragment()

            const start = createState()
            const accept = createState()

            addTransition(start, fragment.start, null)

            addTransition(fragment.accept, fragment.start, null)
            addTransition(fragment.accept, accept, null)

            fragments.push({ start, accept })
            break
        }

        case '?': {
            const fragment = popFragment()

            const start = createState()
            const accept = createState()

            addTransition(start, fragment.start, null)
            addTransition(start, accept, null)

            addTransition(fragment.accept, accept, null)

            fragments.push({ start, accept })
            break;
        }
        
        default: {
            const start = createState()
            const accept = createState()

            addTransition(start, accept, token)

            fragments.push({ start, accept })
        }
        }
    }

    if (fragments.length !== 1) {
        throw new Error('La expresión postfija no genera un único AFN')
    }

    const result = fragments.pop()!

    return {
        start: result.start,
        accept: result.accept,
        states: renumberFromStart(result.start),
    }
}
