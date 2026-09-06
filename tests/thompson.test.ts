import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { regexToPostfix } from '../src/3-shunting-yard'
import { postfixToNFA } from '../src/4-thompson'
import { nfaToDot } from '../src/drawing'

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

    it('genera el AFN en formato DOT', () => {
        const dot = nfaToDot(postfixToNFA('a'))

        assert.match(dot, /^digraph NFA \{/)
        assert.match(dot, /__start -> 0;/)
        assert.match(dot, /0 -> 1 \[label = "a"\];/)
        assert.match(dot, /1 \[shape = doublecircle\];/)
    })
})
