import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { regexToPostfix } from '../src/3-shunting-yard'
import { postfixToNFA } from '../src/4-thompson'
import { nfaToDFA, simulateDFA } from '../src/5-subsets'
import { minimizeDFA } from '../src/6-minimization'

describe('minimización del AFD', () => {
    it('combina estados equivalentes sin cambiar el lenguaje', () => {
        const dfa = nfaToDFA(postfixToNFA(regexToPostfix('a|b')))
        const minimized = minimizeDFA(dfa)

        assert.ok(minimized.states.length < dfa.states.length)
        for (const value of ['', 'a', 'b', 'ab', 'c']) {
            assert.equal(simulateDFA(minimized, value), simulateDFA(dfa, value), value)
        }
    })
})
