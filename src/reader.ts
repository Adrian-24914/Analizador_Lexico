import { readFile } from 'fs/promises'

/**
 * Lee un archivo de texto y devuelve cada línea limpia sin espacios en los extremos.
 */
export async function readLines(filePath: string): Promise<string[]> {
    const content = await readFile(filePath, 'utf-8');
    
    return content
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}