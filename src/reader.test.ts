import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { pairInputs, parseLines } from './reader'

describe('lector de entradas', () => {
    it('acepta saltos de línea de Windows, Unix y un BOM', () => {
        assert.deepEqual(parseLines('\uFEFFa\r\nb\nc\r'), ['a', 'b', 'c'])
    })

    it('conserva una cadena vacía para no desalinear los casos', () => {
        const cases = pairInputs(['a*', 'b+'], ['', 'bbb'])

        assert.deepEqual(cases, [
            { regex: 'a*', value: '', line: 1 },
            { regex: 'b+', value: 'bbb', line: 2 },
        ])
    })

    it('rechaza archivos con diferente cantidad de líneas', () => {
        assert.throws(
            () => pairInputs(['a', 'b'], ['a']),
            /regex\.txt tiene 2 líneas y strings\.txt tiene 1/,
        )
    })

    it('rechaza una expresión regular vacía e indica su línea', () => {
        assert.throws(() => pairInputs(['a', ''], ['a', '']), /línea 2/)
    })
})
