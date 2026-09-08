import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isBalanced } from '../src/2-validator'
import { evaluateDFA, evaluateNFA } from '../src/7-simulation'
import { regexToPostfix } from '../src/3-shunting-yard'
import { postfixToNFA } from '../src/4-thompson'
import { nfaToDFA } from '../src/5-subsets'

function accepts(regex: string, value: string): boolean {
    return evaluateNFA(postfixToNFA(regexToPostfix(regex)), value).accepted
}

describe('simulación del AFN', () => {
    it('acepta una cadena perteneciente al lenguaje', () => {
        assert.equal(accepts('(a|b)*abb', 'aabb'), true)
    })

    it('rechaza una cadena que no pertenece al lenguaje', () => {
        assert.equal(accepts('(a|b)*abb', 'aba'), false)
    })

    it('acepta la cadena vacía cuando la expresión lo permite', () => {
        assert.equal(accepts('a*', ''), true)
    })

    it('considera los operadores escapados como operandos', () => {
        const regex = String.raw`\(\)\*\+\?\.\|`

        assert.equal(isBalanced(regex), true)
        assert.equal(accepts(regex, '()*+?.|'), true)
        assert.equal(accepts(regex, '()*+?.'), false)
    })

    it('registra cada paso del AFN y del AFD', () => {
        const nfa = postfixToNFA(regexToPostfix('ab'))

        assert.deepEqual(evaluateNFA(nfa, 'ab').steps.map(step => step.symbol), [null, 'a', 'b'])
        assert.deepEqual(evaluateDFA(nfaToDFA(nfa), 'ab').steps.map(step => step.symbol), ['a', 'b'])
    })
})
