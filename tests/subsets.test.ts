import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { regexToPostfix } from '../src/3-shunting-yard'
import { postfixToNFA } from '../src/4-thompson'
import { nfaToDFA, simulateDFA } from '../src/5-subsets'
import { dfaToDot } from '../src/drawing'

describe('construcción por subconjuntos', () => {
    it('genera y simula el AFD en formato DOT', () => {
        const dfa = nfaToDFA(postfixToNFA(regexToPostfix('(a|b)*abb')))
        const dot = dfaToDot(dfa)

        assert.equal(simulateDFA(dfa, 'aabb'), true)
        assert.equal(simulateDFA(dfa, 'aba'), false)
        assert.match(dot, /^digraph DFA \{/)
        assert.match(dot, /__start -> D0;/)
        assert.match(dot, /shape = doublecircle/)
    })
})
