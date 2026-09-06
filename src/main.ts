import './styles.css';
import { isBalanced } from './2-validator';
import { insertExplicitConcat, regexToPostfix } from './3-shunting-yard';
import { postfixToNFA } from './4-thompson';
import { renderDFA, renderNFA } from './drawing';
import { nfaToDFA } from './5-subsets';
import { minimizeDFA } from './6-minimization';

const manualView = document.querySelector<HTMLElement>('#manual-view')!;
const fileView = document.querySelector<HTMLElement>('#file-view')!;
const manualViewButton = document.querySelector<HTMLButtonElement>('#manual-view-button')!;
const fileViewButton = document.querySelector<HTMLButtonElement>('#file-view-button')!;
const form = document.querySelector<HTMLFormElement>('#regex-form')!;
const input = document.querySelector<HTMLInputElement>('#regex-input')!;
const formatted = document.querySelector('#formatted-output')!;
const postfixOutput = document.querySelector('#postfix-output')!;
const error = document.querySelector('#error-output')!;
const container = document.querySelector<HTMLElement>('#nfa-container')!;
const dfaContainer = document.querySelector<HTMLElement>('#dfa-container')!;
const minimizedDfaContainer = document.querySelector<HTMLElement>('#minimized-dfa-container')!;
const fileResults = document.querySelector<HTMLElement>('#file-results')!;

function showFileView(show: boolean): void {
    manualView.hidden = show;
    fileView.hidden = !show;
    manualViewButton.setAttribute('aria-pressed', String(!show));
    fileViewButton.setAttribute('aria-pressed', String(show));
}

manualViewButton.addEventListener('click', () => showFileView(false));
fileViewButton.addEventListener('click', () => showFileView(true));

async function draw(): Promise<void> {
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

        const nfa = postfixToNFA(postfix);
        await renderNFA(nfa, container);

        const dfa = nfaToDFA(nfa);
        await renderDFA(dfa, dfaContainer);
        await renderDFA(minimizeDFA(dfa), minimizedDfaContainer);
    } catch (cause) {
        error.textContent =
            cause instanceof Error ? cause.message : 'No se pudo construir el AFN';
    }
}

form.addEventListener('submit', event => {
    event.preventDefault();
    void draw();
});

void draw();

function addDetail(parent: HTMLElement, label: string, value: string): void {
    const detail = document.createElement('p');
    detail.textContent = `${label}: ${value}`;
    parent.append(detail);
}

async function drawFileResults(): Promise<void> {
    try {
        const response = await fetch('/api/regexes');
        const data = await response.json();

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
                const dfa = nfaToDFA(nfa);
                const minimizedDfa = minimizeDFA(dfa);

                card.innerHTML = `<h3>Línea ${inputCase.line}</h3>`;
                addDetail(card, 'Regex', inputCase.regex);
                addDetail(card, 'Postfix', postfix);
                addDetail(card, 'Estados AFD', String(dfa.states.length));
                addDetail(card, 'Estados AFD minimizado', String(minimizedDfa.states.length));

                const graphsWrapper = document.createElement('div');
                graphsWrapper.className = 'graphs-wrapper';
                card.append(graphsWrapper);

                const nfaLabel = document.createElement('p');
                nfaLabel.textContent = 'AFN:';
                graphsWrapper.append(nfaLabel);

                const nfaGraphContainer = document.createElement('div');
                nfaGraphContainer.className = 'nfa-graph';
                nfaGraphContainer.role = 'img';
                nfaGraphContainer.ariaLabel = `AFN de ${inputCase.regex}`;
                graphsWrapper.append(nfaGraphContainer);
                await renderNFA(nfa, nfaGraphContainer);

                const dfaLabel = document.createElement('p');
                dfaLabel.textContent = 'AFD:';
                graphsWrapper.append(dfaLabel);

                const dfaGraphContainer = document.createElement('div');
                dfaGraphContainer.className = 'dfa-graph';
                dfaGraphContainer.role = 'img';
                dfaGraphContainer.ariaLabel = `AFD de ${inputCase.regex}`;
                graphsWrapper.append(dfaGraphContainer);
                await renderDFA(dfa, dfaGraphContainer);

                const minimizedLabel = document.createElement('p');
                minimizedLabel.textContent = 'AFD minimizado:';
                graphsWrapper.append(minimizedLabel);

                const minimizedGraphContainer = document.createElement('div');
                minimizedGraphContainer.className = 'dfa-graph';
                minimizedGraphContainer.role = 'img';
                minimizedGraphContainer.ariaLabel = `AFD minimizado de ${inputCase.regex}`;
                graphsWrapper.append(minimizedGraphContainer);
                await renderDFA(minimizedDfa, minimizedGraphContainer);
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
