import './styles.css';
import { isBalanced } from './2-validator';
import { insertExplicitConcat, regexToPostfix } from './3-shunting-yard';
import { postfixToNFA } from './4-thompson';
import { renderDFA, renderNFA } from './drawing';
import { nfaToDFA } from './5-subsets';
import { minimizeDFA } from './6-minimization';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function processRegex(rawRegex: string) {
    const regex = rawRegex.trim();
    if (!regex || !isBalanced(regex)) {
        throw new Error('Invalid or unbalanced regular expression');
    }

    const explicit = insertExplicitConcat(regex);
    const postfix = regexToPostfix(regex);
    const nfa = postfixToNFA(postfix);
    const dfa = nfaToDFA(nfa);
    const minDfa = minimizeDFA(dfa);

    return { regex, explicit, postfix, nfa, dfa, minDfa };
}

async function renderGraphs(
    { nfa, dfa, minDfa }: Pick<ReturnType<typeof processRegex>, 'nfa' | 'dfa' | 'minDfa'>,
    targets: { nfa: HTMLElement; dfa: HTMLElement; minDfa: HTMLElement }
) {
    await renderNFA(nfa, targets.nfa);
    await renderDFA(dfa, targets.dfa);
    await renderDFA(minDfa, targets.minDfa);
}

// Control de vistas (Pestañas)
function setFileView(showFile: boolean): void {
    $('manual-view').hidden = showFile;
    $('file-view').hidden = !showFile;
    $('manual-view-button').setAttribute('aria-pressed', String(!showFile));
    $('file-view-button').setAttribute('aria-pressed', String(showFile));
}

$('manual-view-button').onclick = () => setFileView(false);
$('file-view-button').onclick = () => setFileView(true);

// Vista manual
async function drawManual(): Promise<void> {
    const errorEl = $('error-output');
    errorEl.textContent = '';

    const input = $('regex-input') as HTMLInputElement;
    const value = input.value.trim();

    // Evita error visual si el input arranca vacío
    if (!value) return;

    try {
        const result = processRegex(value);

        $('formatted-output').textContent = result.explicit;
        $('postfix-output').textContent = result.postfix;

        await renderGraphs(result, {
            nfa: $('nfa-container'),
            dfa: $('dfa-container'),
            minDfa: $('minimized-dfa-container'),
        });
    } catch (err) {
        errorEl.textContent = err instanceof Error ? err.message : 'Error constructing automaton';
    }
}

$('regex-form').onsubmit = (event) => {
    event.preventDefault();
    void drawManual();
};

void drawManual();

// Vista por archivo
async function drawFileResults(): Promise<void> {
    const container = $('file-results');

    try {
        const response = await fetch('/api/inputs');
        const data = await response.json();

        if (!response.ok || !Array.isArray(data)) {
            throw new Error(data?.error ?? 'Failed to load file items');
        }

        for (const item of data) {
            const card = document.createElement('article');
            card.className = 'case-card';
            container.append(card);

            try {
                const result = processRegex(item.regex);

                // Estructura exacta a la de manual-view:
                // Título blanco -> Contenedor blanco (.nfa-graph / .dfa-graph)
                card.innerHTML = `
                    <h2 class="case-title">Infix Regular Expression: <code>${result.regex}</code></h2>
                    <h2 class="case-title">Postfix expression: <code>${result.postfix}</code> </h2>
                    <h2 class="case-title">String to evaluate: <code>${item.value}</code></h2>

                    <h3>NFA (Thompson algorithm)</h3>
                    <div class="nfa-graph" role="img" aria-label="NFA of ${result.regex}"></div>

                    <h3>DFA (subset construction algorithm)</h3>
                    <div class="dfa-graph" role="img" aria-label="DFA of ${result.regex}"></div>

                    <h3>DFA (partitioning algorithm)</h3>
                    <div class="dfa-graph" role="img" aria-label="Minimized DFA of ${result.regex}"></div>
                `;

                const [nfaEl, dfaEl, minDfaEl] = card.querySelectorAll<HTMLElement>('.nfa-graph, .dfa-graph');
                await renderGraphs(result, { nfa: nfaEl, dfa: dfaEl, minDfa: minDfaEl });
            } catch (err) {
                card.className = 'case-card invalid';
                card.innerHTML = `<p class="error">Line ${item.line}: ${err instanceof Error ? err.message : 'Unknown error'}</p>`;
            }
        }
    } catch (err) {
        container.textContent = err instanceof Error ? err.message : 'Failed to display results';
    }
}

void drawFileResults();