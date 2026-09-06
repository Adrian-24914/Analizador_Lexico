import type { NFA, State } from './4-thompson'

function epsilonClosure(initialStates: State[]): Set<State> {
    const closure = new Set(initialStates)
    const pending = [...initialStates]

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

export function simulateNFA(nfa: NFA, value: string): boolean {
    let currentStates = epsilonClosure([nfa.start])

    for (const symbol of value) {
        const nextStates = [...currentStates].flatMap(state =>
            state.transitions
                .filter(transition => transition.symbol === symbol)
                .map(transition => transition.to),
        )

        currentStates = epsilonClosure(nextStates)
    }

    return currentStates.has(nfa.accept)
}
