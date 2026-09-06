import './styles.css';
import { isBalanced } from './2-validator';
import { insertExplicitConcat, regexToPostfix } from './3-shunting-yard';
import { postfixToNFA } from './4-thompson';
import { renderDFA, renderNFA } from './drawing';
import { nfaToDFA } from './5-subsets';
import { minimizeDFA } from './6-minimization';

// Selector de elementos del DOM por ID con tipado genérico
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// Procesamiento de la expresión regular: validación, conversión a notación explícita, postfix, NFA, DFA y DFA minimizado
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

// Renderizado para NFA, DFA y DFA minimizado en contenedores específicos del DOM
async function renderGraphs(
    { nfa, dfa, minDfa }: Pick<ReturnType<typeof processRegex>, 'nfa' | 'dfa' | 'minDfa'>,
    targets: { nfa: HTMLElement; dfa: HTMLElement; minDfa: HTMLElement }
) {
    await renderNFA(nfa, targets.nfa);
    await renderDFA(dfa, targets.dfa);
    await renderDFA(minDfa, targets.minDfa);
}

// 3. Pestañas: alternar entre vista manual y vista por archivo
function setFileView(showFile: boolean): void {
    $('manual-view').hidden = showFile;
    $('file-view').hidden = !showFile;
    $('manual-view-button').setAttribute('aria-pressed', String(!showFile));
    $('file-view-button').setAttribute('aria-pressed', String(showFile));
}

$('manual-view-button').onclick = () => setFileView(false);
$('file-view-button').onclick = () => setFileView(true);

// Vista manual (Infix expression)
async function drawManual(): Promise<void> {
    const errorEl = $('error-output');
    errorEl.textContent = '';

    try {
        const input = $('regex-input') as HTMLInputElement;
        const result = processRegex(input.value);

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

// Vista por archivo (Automatons from regex.txt)
async function drawFileResults(): Promise<void> {
    const container = $('file-results');

    try {
        const response = await fetch('/api/regexes');
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

                card.innerHTML = `
                    <h3>Line ${item.line}: <code>${result.regex}</code></h3>
                    <p><strong>Postfix:</strong> <code>${result.postfix}</code></p>
                    <p><strong>DFA States:</strong> ${result.dfa.states.length} | <strong>Minimized:</strong> ${result.minDfa.states.length}</p>
                    
                    <div class="graphs-wrapper">
                        <h4>NFA (Thompson)</h4>
                        <div class="nfa-graph" role="img" aria-label="NFA of ${result.regex}"></div>

                        <h4>DFA (Subsets)</h4>
                        <div class="dfa-graph" role="img" aria-label="DFA of ${result.regex}"></div>

                        <h4>DFA (Minimized)</h4>
                        <div class="dfa-graph" role="img" aria-label="Minimized DFA of ${result.regex}"></div>
                    </div>
                `;

                const [nfaEl, dfaEl, minDfaEl] = card.querySelectorAll<HTMLElement>('.graphs-wrapper > div');
                await renderGraphs(result, { nfa: nfaEl, dfa: dfaEl, minDfa: minDfaEl });
            } catch (err) {
                card.className = 'case-card invalid';
                card.innerHTML = `<h3>Line ${item.line}</h3><p class="error">Error: ${err instanceof Error ? err.message : 'Unknown'}</p>`;
            }
        }
    } catch (err) {
        container.textContent = err instanceof Error ? err.message : 'Failed to display results';
    }
}

void drawFileResults();