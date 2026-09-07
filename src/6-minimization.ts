import type { DFA, DFAState } from './5-subsets';

// Funcion para minimizar un DFA usando el algoritmo de particiones
export function minimizeDFA(dfa: DFA): DFA {
    const alphabet = dfa.alphabet;
    let partitions = [
        dfa.states.filter(state => !state.isAccept),
        dfa.states.filter(state => state.isAccept),
    ].filter(group => group.length > 0);

    while (true) {
        const groupId = (state?: DFAState): number =>
            state ? partitions.findIndex(group => group.includes(state)) : -1;
        const nextPartitions = partitions.flatMap(group => {
            const splits: Record<string, DFAState[]> = {};

            for (const state of group) {
                const key = alphabet.map(symbol => groupId(state.transitions[symbol])).join(',');
                (splits[key] ??= []).push(state);
            }

            return Object.values(splits);
        });

        if (nextPartitions.length === partitions.length) break;
        partitions = nextPartitions;
    }

    const states: DFAState[] = partitions.map((group, id) => ({
        id,
        nfaStates: group.flatMap(state => state.nfaStates),
        isAccept: group[0].isAccept,
        transitions: {},
    }));

    partitions.forEach((group, index) => {
        for (const symbol of alphabet) {
            const target = group[0].transitions[symbol];

            if (target) {
                states[index].transitions[symbol] = states[
                    partitions.findIndex(partition => partition.includes(target))
                ];
            }
        }
    });

    return {
        start: states[partitions.findIndex(group => group.includes(dfa.start))],
        states,
        alphabet,
    };
}
