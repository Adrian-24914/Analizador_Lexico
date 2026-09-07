# Analizador de expresiones regulares

El programa lee expresiones regulares desde `regex.txt` y cadenas desde
`strings.txt`. Cada expresión se relaciona con la cadena ubicada en el mismo
número de línea.

Actualmente, cada caso pasa por este flujo:

1. Conversión de notación infix a postfix.
2. Construcción del AFN mediante Thompson.
3. Simulación de la cadena en el AFN.

Una expresión inválida se reporta con su número de línea y no detiene el
procesamiento de los demás casos.

Los resultados y cada AFN renderizado desde formato DOT se muestran en la página web.

## Archivos de entrada

Ambos archivos deben tener la misma cantidad de líneas. Se utiliza `ε` en
`strings.txt` para representar la cadena vacía.

```text
regex.txt       strings.txt
(a|b)*abb       aabb
a*              ε
```

## Ejecución

```powershell
pnpm install
pnpm start
```

Después, abra `http://localhost:5173/` en el navegador.

Las pruebas y la verificación de tipos se ejecutan con:

```powershell
pnpm test
pnpm typecheck
```

La misma página incluye un formulario para probar expresiones manualmente.
