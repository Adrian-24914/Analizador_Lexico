import { readFile } from 'fs/promises'

export interface InputCase {
    regex: string
    value: string
    line: number
}

export function parseLines(content: string): string[] {
    const lines = content
        .replace(/^\uFEFF/, '')
        .replace(/\r\n?/g, '\n')
        .split('\n')

    // El salto de línea final cierra la última entrada; no crea otra.
    if (lines.at(-1) === '') {
        lines.pop()
    }

    return lines.map(line => line.trim())
}

export function pairInputs(regexLines: string[], stringLines: string[]): InputCase[] {
    if (regexLines.length !== stringLines.length) {
        throw new Error(
            `regex.txt tiene ${regexLines.length} líneas y strings.txt tiene ${stringLines.length}`,
        )
    }

    return regexLines.map((regex, index) => {
        if (!regex) {
            throw new Error(`La expresión regular de la línea ${index + 1} está vacía`)
        }

        return { regex, value: stringLines[index]!, line: index + 1 }
    })
}

export async function readInputCases(
    regexPath = 'regex.txt',
    stringsPath = 'strings.txt',
): Promise<InputCase[]> {
    const [regexContent, stringsContent] = await Promise.all([
        readFile(regexPath, 'utf-8'),
        readFile(stringsPath, 'utf-8'),
    ])

    return pairInputs(parseLines(regexContent), parseLines(stringsContent))
}
