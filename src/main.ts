import './styles.css';
import type { Core } from 'cytoscape';
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
