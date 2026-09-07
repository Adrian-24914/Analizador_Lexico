import type { DFA, DFAState } from './5-subsets';

// Minimiza un DFA marcando pares de estados distinguibles (Myhill-Nerode).
export function minimizeDFAWithMyhill(dfa: DFA): DFA {
    const pairKey = (a: DFAState, b: DFAState) =>
        a.id < b.id ? `${a.id},${b.id}` : `${b.id},${a.id}`;
    const pairs = dfa.states.flatMap((state, index) =>
        dfa.states.slice(index + 1).map(other => [state, other] as const)
    );
    const distinguishable = new Set(
        pairs.filter(([a, b]) => a.isAccept !== b.isAccept).map(([a, b]) => pairKey(a, b))
    );

    let changed = true;
    while (changed) {
        changed = false;
        for (const [a, b] of pairs) {
            const key = pairKey(a, b);
            if (distinguishable.has(key)) continue;

            const separates = dfa.alphabet.some(symbol => {
                const nextA = a.transitions[symbol];
                const nextB = b.transitions[symbol];
                return Boolean(nextA) !== Boolean(nextB)
                    || Boolean(nextA && nextB && nextA !== nextB && distinguishable.has(pairKey(nextA, nextB)));
            });

            if (separates) {
                distinguishable.add(key);
                changed = true;
            }
        }
    }

    const groups: DFAState[][] = [];
    for (const state of dfa.states) {
        const group = groups.find(([representative]) =>
            representative === state || !distinguishable.has(pairKey(representative, state))
        );
        group ? group.push(state) : groups.push([state]);
    }

    const groupByState = new Map(groups.flatMap((group, index) => group.map(state => [state, index])));
    const states: DFAState[] = groups.map((group, id) => ({
        id,
        nfaStates: group.flatMap(state => state.nfaStates),
        isAccept: group[0].isAccept,
        transitions: {},
    }));

    groups.forEach((group, index) => {
        for (const symbol of dfa.alphabet) {
            const target = group[0].transitions[symbol];
            if (target) states[index].transitions[symbol] = states[groupByState.get(target)!];
        }
    });

    return {
        start: states[groupByState.get(dfa.start)!],
        states,
        alphabet: dfa.alphabet,
    };
}