import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { simulateNFA } from './nfa-simulator'
import { regexToPostfix } from './shunting-yard'
import { postfixToNFA } from './thompson'

function accepts(regex: string, value: string): boolean {
    return simulateNFA(postfixToNFA(regexToPostfix(regex)), value)
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
})
