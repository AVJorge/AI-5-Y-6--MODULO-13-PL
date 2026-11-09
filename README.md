# Ahorra, invierte y paga a plazos · Módulo 13

Material interactivo de apoyo para las **Actividades integradoras 5 y 6 del Módulo 13** de Prepa en Línea-SEP. Explica los procedimientos con datos de ejemplo, sin dar los resultados de las actividades. Un selector en la parte superior cambia entre las dos actividades; cada una tiene su propio enlace (`#ai5` y `#ai6`).

## Actividad integradora 5 · Mi ahorro

| Sección | Qué hace el estudiante |
|---|---|
| 1. Conceptos | Distingue ingreso, egreso, saldo y ahorro. |
| 2. Presupuesto anual | Revisa el presupuesto de doce meses de una familia de ejemplo, ajusta dos gastos y ve en qué mes el ahorro acumulado alcanza una meta. |
| 3. ¿Qué es una anualidad? | Entiende qué es una anualidad y por qué el interés de cada pago baja. |
| 4. Calcula una mensualidad | Resuelve la fórmula paso a paso, ve cada pago dividido en interés y capital y lo compara con un atajo incorrecto. Los montos van de $5 000 a $30 000 y no hay tasa de 9 %. |
| 5. Hoja de cálculo | Consulta las fórmulas de las cuatro hojas (`SUMA`, referencias entre hojas, `SI`, `PAGO`). |
| 6–8 | Ruta por pregunta, tres preguntas con retroalimentación y lista de revisión. |

## Actividad integradora 6 · Mi inversión

| Sección | Qué hace el estudiante |
|---|---|
| 1. Capitalización | Compara la misma tasa con capitalización anual, semestral, trimestral y mensual. |
| 2. Comparar instituciones | Calcula el rendimiento de cinco instituciones de ejemplo y elige según el riesgo que acepta. |
| 3. Del ahorro al enganche | Ve cómo el monto de la inversión se convierte en enganche y cuánto queda por financiar. |
| 4. Tabla de amortización | Construye la tabla renglón por renglón con explicación de cada columna. |
| 5. 24 o 48 meses | Compara mensualidad, total pagado e intereses de los dos plazos. |
| 6. Hoja de cálculo | Consulta las fórmulas de interés compuesto, `VF`, `PAGO` y la tabla de amortización. |
| 7–9 | Ruta por pregunta, tres preguntas con retroalimentación y lista de revisión. |

## Estructura

```
index.html          Página principal
assets/styles.css   Estilos
assets/app.js       Lógica interactiva (sin dependencias)
.nojekyll           Evita que GitHub Pages procese los archivos con Jekyll
tests/test_page.py  Prueba automatizada (opcional)
```

## Publicar en GitHub Pages

1. Crea un repositorio público (por ejemplo, `material-modulo13-ai5-ai6`).
2. Sube el contenido de esta carpeta. **Verifica que `styles.css` y `app.js` queden dentro de la carpeta `assets`.** Si quedan sueltos, ábrelos, pulsa el lápiz y escribe `assets/` antes del nombre.
3. Ve a **Settings → Pages**, elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guarda.
4. En uno o dos minutos la dirección será `https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`.

Enlaces para compartir: agrega `#ai5` o `#ai6` al final de la dirección.

## Ajustar los datos de ejemplo

Todos están en `assets/app.js`: `INGRESOS`, `EGRESOS` y `META` (familia Ruiz), `INST` y `CAP0` (instituciones), `AUTO` (precio del auto). Los rangos y opciones de los controles están en `index.html`. Si los cambias, verifica que no coincidan con los datos de las actividades.

## Prueba automatizada (opcional)

```
pip install playwright
python -m playwright install chromium
python tests/test_page.py "$(pwd)"
```
