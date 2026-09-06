import './styles.css';
import type { Core } from 'cytoscape';
import { simulateNFA } from './nfa-simulator';
import type { InputCase } from './reader';
import { isBalanced } from './validator';
import { insertExplicitConcat, regexToPostfix } from './shunting-yard';
import { postfixToNFA } from './thompson';
import { renderNFA } from './cytoscape';

const form = document.querySelector<HTMLFormElement>('#regex-form')!;
const input = document.querySelector<HTMLInputElement>('#regex-input')!;
const formatted = document.querySelector('#formatted-output')!;
const postfixOutput = document.querySelector('#postfix-output')!;
const error = document.querySelector('#error-output')!;
const container = document.querySelector<HTMLElement>('#nfa-container')!;
const fileResults = document.querySelector<HTMLElement>('#file-results')!;

let graph: Core | undefined;

function draw(): void {
    error.textContent = '';

    try {
        const regex = input.value.trim();

        if (!regex || !isBalanced(regex)) {
        throw new Error('La expresión regular no es válida');
        }

        const explicit = insertExplicitConcat(regex);
        const postfix = regexToPostfix(regex);

        formatted.textContent = explicit;
        postfixOutput.textContent = postfix;

        graph?.destroy();
        graph = renderNFA(postfixToNFA(postfix), container);
    } catch (cause) {
        error.textContent =
        cause instanceof Error ? cause.message : 'No se pudo construir el AFN';
    }
}

form.addEventListener('submit', event => {
    event.preventDefault();
    draw();
});

draw();

function addDetail(parent: HTMLElement, label: string, value: string): void {
    const detail = document.createElement('p');
    detail.textContent = `${label}: ${value}`;
    parent.append(detail);
}

async function drawFileResults(): Promise<void> {
    try {
        const response = await fetch('/api/inputs');
        const data = await response.json() as InputCase[] | { error: string };

        if (!response.ok || !Array.isArray(data)) {
            throw new Error(Array.isArray(data) ? 'No se pudieron leer los archivos' : data.error);
        }

        for (const inputCase of data) {
            const card = document.createElement('article');
            card.className = 'case-card';
            fileResults.append(card);

            try {
                if (!isBalanced(inputCase.regex)) {
                    throw new Error('paréntesis no balanceados');
                }

                const postfix = regexToPostfix(inputCase.regex);
                const nfa = postfixToNFA(postfix);
                const value = inputCase.value === 'ε' ? '' : inputCase.value;
                const accepted = simulateNFA(nfa, value);

                card.classList.add(accepted ? 'accepted' : 'rejected');
                card.innerHTML = `<h3>Línea ${inputCase.line}: ${accepted ? 'sí' : 'no'}</h3>`;
                addDetail(card, 'Regex', inputCase.regex);
                addDetail(card, 'Cadena', inputCase.value || 'ε');
                addDetail(card, 'Postfix', postfix);

                const graphContainer = document.createElement('div');
                graphContainer.className = 'nfa-graph';
                card.append(graphContainer);
                renderNFA(nfa, graphContainer);
            } catch (cause) {
                const message = cause instanceof Error ? cause.message : 'error desconocido';
                card.classList.add('invalid');
                card.textContent = `Línea ${inputCase.line}: error - ${message}`;
            }
        }
    } catch (cause) {
        fileResults.textContent = cause instanceof Error
            ? cause.message
            : 'No se pudieron mostrar los resultados';
    }
}

void drawFileResults();
