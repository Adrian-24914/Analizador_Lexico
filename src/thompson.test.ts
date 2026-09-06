import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { regexToPostfix } from './shunting-yard'
import { postfixToNFA } from './thompson'

describe('construcción de Thompson', () => {
    it('numera siempre el estado inicial como q0', () => {
        const expressions = ['a', 'a*', '(a|b)*abb', '(0|1)+00', 'a(b|c)*']

        for (const regex of expressions) {
            const nfa = postfixToNFA(regexToPostfix(regex))

            assert.equal(nfa.start.id, 0, regex)
            assert.deepEqual(nfa.states.map(state => state.id),
                nfa.states.map((_, index) => index))
        }
    })
})
