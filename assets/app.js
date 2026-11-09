/* Ahorra, invierte y paga a plazos · Módulo 13 (AI5 y AI6)
   Material interactivo sin dependencias externas. */
(function () {
  'use strict';

  /* ===================== Utilidades ===================== */
  const $ = (id) => document.getElementById(id);
  const zero = (n) => (Math.abs(n) < 0.005 ? 0 : n);
  const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const money = (n) => { n = zero(n); return (n < 0 ? '−$' : '$') + group(String(Math.round(Math.abs(n)))); };
  const money2 = (n) => { n = zero(n); const t = Math.abs(n).toFixed(2).split('.'); return (n < 0 ? '−$' : '$') + group(t[0]) + '.' + t[1]; };
  const pct = (x) => String(Math.round(x * 100) / 100).replace(/\.0+$/, '') + ' %';
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const SVGNS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, text) {
    const n = document.createElementNS(SVGNS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function setPressed(groupSel, btn) {
    document.querySelectorAll(groupSel + ' button').forEach((b) => {
      const on = b === btn; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
  }
  // Pago de una anualidad (mensualidad). P = monto, i = tasa por periodo, n = número de pagos.
  const pago = (P, i, n) => (i === 0 ? P / n : P * i / (1 - Math.pow(1 + i, -n)));

  /* ===================== Selector de actividades ===================== */
  const ACTS = { ai5: 'act5', ai6: 'act6' };
  function show(act) {
    Object.keys(ACTS).forEach((a) => {
      $(ACTS[a]).hidden = a !== act;
      if (a === act) $('sw-' + a).setAttribute('aria-current', 'page');
      else $('sw-' + a).removeAttribute('aria-current');
    });
  }
  function route() {
    let h = location.hash.slice(1);
    try { h = decodeURIComponent(h); } catch (e) { h = ''; }
    if (ACTS[h]) { show(h); window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    const t = h ? document.getElementById(h) : null;
    const box = t && t.closest('.activity');
    show(box ? Object.keys(ACTS).find((a) => ACTS[a] === box.id) : 'ai5');
    if (t && box) t.scrollIntoView();
  }
  window.addEventListener('hashchange', route);
  route();

  /* ===================== Componentes compartidos ===================== */
  // Hoja de cálculo de muestra con fórmulas que se explican al hacer clic.
  function renderSheet(tableId, ftextId, fexpId, header, rows, FX) {
    const t = $(tableId);
    t.textContent = '';
    const hr = t.insertRow();
    header.forEach((h) => { const th = document.createElement('th'); th.textContent = h; hr.appendChild(th); });
    rows.forEach((r) => {
      const tr = t.insertRow();
      const rh = tr.insertCell(); rh.className = 'rh'; rh.textContent = r[0];
      r.slice(1).forEach((c) => {
        const cell = typeof c === 'object' && c !== null ? c : { t: c };
        const td = tr.insertCell();
        td.textContent = cell.t;
        if (cell.span) td.colSpan = cell.span;
        if (cell.cls) td.className = cell.cls;
        else if (/^=/.test(cell.t)) td.className = 'f';
        else if (/^dato/.test(cell.t)) td.className = 'inp';
        else if (cell.t === '…' || /^…/.test(cell.t)) { td.style.color = '#888'; td.style.fontFamily = "'Source Sans 3',sans-serif"; }
      });
    });
    t.querySelectorAll('td.f').forEach((td) => {
      td.tabIndex = 0;
      td.setAttribute('role', 'button');
      const showF = () => {
        t.querySelectorAll('td.sel').forEach((x) => x.classList.remove('sel'));
        td.classList.add('sel');
        const f = td.textContent.trim();
        $(ftextId).textContent = f;
        $(fexpId).textContent = FX[f] || '';
      };
      td.addEventListener('click', showF);
      td.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showF(); } });
    });
    $(ftextId).textContent = 'Selecciona una celda azul.';
    $(fexpId).textContent = 'Aquí aparecerá la explicación de la fórmula.';
  }

  function buildQuiz(containerId, Q) {
    const qz = $(containerId);
    Q.forEach((q, qi) => {
      const d = document.createElement('div'); d.className = 'q';
      const p = document.createElement('p'); p.textContent = `${qi + 1}. ${q.p}`; d.appendChild(p);
      const fb = document.createElement('div'); fb.className = 'fb'; fb.setAttribute('aria-live', 'polite');
      q.o.forEach((txt, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = txt;
        b.addEventListener('click', () => {
          d.querySelectorAll('button').forEach((x) => x.classList.remove('right', 'wrong'));
          b.classList.add(i === q.a ? 'right' : 'wrong');
          fb.textContent = (i === q.a ? '✅ ' : '↺ ') + q.f[i] + (i === q.a ? '' : ' Intenta otra opción.');
        });
        d.appendChild(b);
      });
      d.appendChild(fb); qz.appendChild(d);
    });
  }

  function buildChecklist(sectionId) {
    const sec = $(sectionId);
    const cbs = sec.querySelectorAll('.check input');
    const bar = sec.querySelector('.prog div'), wrap = sec.querySelector('.prog'), txt = sec.querySelector('.ptext');
    cbs.forEach((c) => c.addEventListener('change', () => {
      const n = [...cbs].filter((x) => x.checked).length;
      bar.style.width = (n / cbs.length * 100) + '%';
      wrap.setAttribute('aria-valuenow', n);
      txt.textContent = `${n} de ${cbs.length}` + (n === cbs.length ? ' · ¡Listo para entregar!' : '');
    }));
  }

  /* ===================== AI5 · Presupuesto de la familia Ruiz ===================== */
  const META = 24 * 1150;
  const INGRESOS = [['Sueldo de papá', 7800], ['Sueldo de mamá', 7200], ['Sueldo propio', 5500]];
  // Cada egreso devuelve el monto del mes m (0 = enero).
  const EGRESOS = [
    ['Hipoteca', () => 6500],
    ['Alimentos', () => +$('eAli').value],
    ['Transporte', () => 1800],
    ['Agua', () => 350],
    ['Luz (bimestral)', (m) => (m % 2 === 1 ? 1100 : 0)],
    ['TV cable', () => 400],
    ['Internet', () => 450],
    ['Otros gastos', () => +$('eOtr').value]
  ];

  function ruiz() {
    const ing = MESES.map(() => INGRESOS.reduce((a, r) => a + r[1], 0));
    const egr = MESES.map((_, m) => EGRESOS.reduce((a, r) => a + r[1](m), 0));
    const sal = ing.map((v, m) => v - egr[m]);
    let s = 0;
    const acc = sal.map((v) => (s += v));
    const reach = acc.findIndex((v) => v >= META);
    return { ing, egr, sal, acc, reach };
  }

  function renderRuiz() {
    $('vAli').textContent = money(+$('eAli').value);
    $('vOtr').textContent = money(+$('eOtr').value);
    const d = ruiz();
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    $('kMeta').textContent = money(META);
    $('kIng').textContent = money(sum(d.ing));
    $('kEgr').textContent = money(sum(d.egr));
    $('kMes').textContent = d.reach >= 0 ? `En ${MESES_L[d.reach]} (mes ${d.reach + 1})` : 'No en este año';

    const t = $('tRuiz');
    t.textContent = '';
    const head = t.createTHead().insertRow();
    ['Concepto', ...MESES, 'Total'].forEach((h) => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = h; head.appendChild(th); });
    const body = t.createTBody();
    const addRow = (label, vals, cls, total = true) => {
      const tr = body.insertRow();
      if (cls) tr.className = cls;
      tr.insertCell().textContent = label;
      vals.forEach((v) => { tr.insertCell().textContent = money(v); });
      tr.insertCell().textContent = total ? money(sum(vals)) : '';
      return tr;
    };
    INGRESOS.forEach(([n, v]) => addRow(n, MESES.map(() => v)));
    addRow('Ingresos totales', d.ing, 'tot');
    EGRESOS.forEach(([n, f]) => addRow(n, MESES.map((_, m) => f(m))));
    addRow('Egresos totales', d.egr, 'tot');
    addRow('Saldo (ingresos − egresos)', d.sal, 'tot');
    const accRow = addRow('Ahorro acumulado', d.acc, 'goal', false);
    if (d.reach >= 0) accRow.cells[d.reach + 1].className = 'reach';

    // Gráfica de ahorro acumulado contra la meta
    const svg = $('cRuiz');
    clear(svg);
    const W = 720, H = 280, L = 70, R = 16, T = 18, B = 34;
    const maxV = Math.max(META, ...d.acc) * 1.1;
    const bw = (W - L - R) / 12;
    const ys = (v) => H - B - v / maxV * (H - T - B);
    for (let k = 0; k <= 4; k++) {
      const v = maxV * k / 4, y = ys(v);
      svg.appendChild(el('line', { x1: L, x2: W - R, y1: y, y2: y, stroke: '#eee' }));
      svg.appendChild(el('text', { x: L - 8, y: y + 4, 'font-size': 12, 'text-anchor': 'end', fill: '#5b6670' }, money(v)));
    }
    d.acc.forEach((v, m) => {
      const x = L + m * bw + bw * 0.18;
      svg.appendChild(el('rect', { x, y: ys(v), width: bw * 0.64, height: H - B - ys(v), rx: 3, fill: m === d.reach ? '#1f8a5b' : '#2b5d8a' }));
      svg.appendChild(el('text', { x: L + m * bw + bw / 2, y: H - B + 18, 'font-size': 12, 'text-anchor': 'middle', fill: '#5b6670' }, MESES[m]));
    });
    const my = ys(META);
    svg.appendChild(el('line', { x1: L, x2: W - R, y1: my, y2: my, stroke: '#c2492d', 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }));
    svg.appendChild(el('text', { x: W - R, y: my - 6, 'font-size': 12.5, 'font-weight': 700, 'text-anchor': 'end', fill: '#c2492d' }, 'Meta ' + money(META)));
    svg.setAttribute('aria-label', 'Ahorro acumulado por mes. ' + (d.reach >= 0 ? `Alcanza la meta en ${MESES_L[d.reach]}.` : 'No alcanza la meta en el año.'));
  }
  ['eAli', 'eOtr'].forEach((id) => $(id).addEventListener('input', renderRuiz));
  renderRuiz();

  /* ===================== AI5 · Calculadora de anualidad ===================== */
  function renderAnu() {
    const P = +$('aP').value, r = +$('aR').value, n = +$('aN').value;
    const i = r / 100 / 12;
    const R = pago(P, i, n);
    const f = Math.pow(1 + i, -n);
    $('vaP').textContent = money(P);
    $('aSteps').innerHTML =
      `1. Tasa mensual: i = ${pct(r)} ÷ 12 = ${pct(r / 12)} = <b>${i.toFixed(5)}</b><br>` +
      `2. (1 + i)<sup>−n</sup> = ${(1 + i).toFixed(5)}<sup>−${n}</sup> = <b>${f.toFixed(5)}</b><br>` +
      `3. 1 − ${f.toFixed(5)} = <b>${(1 - f).toFixed(5)}</b><br>` +
      `4. P × i = ${money(P)} × ${i.toFixed(5)} = <b>${money2(P * i)}</b><br>` +
      `5. R = ${money2(P * i)} ÷ ${(1 - f).toFixed(5)} = <b>${money2(R)}</b> cada mes`;
    $('aR1').textContent = money2(R);
    $('aTot').textContent = money2(R * n);
    $('aInt').textContent = money2(R * n - P);

    // Barras: cada pago dividido en interés y capital
    const svg = $('cAnu');
    clear(svg);
    const W = 720, H = 260, L = 64, Rr = 12, T = 14, B = 30;
    const bw = (W - L - Rr) / n;
    const ys = (v) => H - B - v / (R * 1.08) * (H - T - B);
    [0, 0.5, 1].forEach((k) => {
      const v = R * k, y = ys(v);
      svg.appendChild(el('line', { x1: L, x2: W - Rr, y1: y, y2: y, stroke: '#eee' }));
      svg.appendChild(el('text', { x: L - 6, y: y + 4, 'font-size': 11.5, 'text-anchor': 'end', fill: '#5b6670' }, money(v)));
    });
    let saldo = P;
    for (let k = 0; k < n; k++) {
      const int = saldo * i, cap = R - int;
      saldo -= cap;
      const x = L + k * bw + bw * 0.15, w = bw * 0.7;
      svg.appendChild(el('rect', { x, y: ys(cap), width: w, height: H - B - ys(cap), fill: '#1f8a5b' }));
      svg.appendChild(el('rect', { x, y: ys(R), width: w, height: ys(cap) - ys(R), fill: '#c2492d' }));
      if (n <= 12 || k % 2 === 0 || k === n - 1) {
        svg.appendChild(el('text', { x: L + k * bw + bw / 2, y: H - B + 16, 'font-size': 11.5, 'text-anchor': 'middle', fill: '#5b6670' }, k + 1));
      }
    }
    svg.setAttribute('aria-label', `${n} pagos iguales de ${money2(R)}. El interés baja y el abono a capital sube cada mes.`);

    const simpleI = P * (r / 100) * (n / 12);
    const wrong = (P + simpleI) / n;
    $('aWrong').innerHTML = `Calcular el interés sobre el monto completo todo el plazo: ${money(P)} × ${pct(r)} × ${n}/12 = ${money2(simpleI)}, y dividir: (${money(P)} + ${money2(simpleI)}) ÷ ${n} = <b>${money2(wrong)}</b> al mes. Así se cobra interés sobre dinero que ya pagaste.`;
    $('aRight').innerHTML = `El interés solo se cobra sobre lo que aún debes. Pago: <b>${money2(R)}</b> al mes, con ${money2(R * n - P)} de intereses en total, es decir, ${money2(simpleI - (R * n - P))} menos que con el atajo.`;
  }
  ['aP', 'aR', 'aN'].forEach((id) => $(id).addEventListener('input', renderAnu));
  ['aR', 'aN'].forEach((id) => $(id).addEventListener('change', renderAnu));
  renderAnu();

  /* ===================== AI5 · Hojas de cálculo ===================== */
  const S5 = {
    1: {
      header: ['', 'A', 'B', 'C', '…', 'M', 'N'],
      rows: [
        ['1', { t: 'Ingresos', cls: 'lbl' }, { t: 'Ene', cls: 'lbl' }, { t: 'Feb', cls: 'lbl' }, '…', { t: 'Dic', cls: 'lbl' }, { t: 'Total anual', cls: 'lbl' }],
        ['2', { t: 'Salario papá', cls: 'lbl' }, 'dato', '=B2', '…', '=L2', '=SUMA(B2:M2)'],
        ['3', { t: 'Salario mamá', cls: 'lbl' }, 'dato', '=B3', '…', '=L3', '=SUMA(B3:M3)'],
        ['4', { t: 'Salario propio', cls: 'lbl' }, 'dato', '=B4', '…', '=L4', '=SUMA(B4:M4)'],
        ['5', { t: 'Ingresos totales', cls: 'lbl' }, '=SUMA(B2:B4)', '=SUMA(C2:C4)', '…', '=SUMA(M2:M4)', '=SUMA(B5:M5)']
      ],
      FX: {
        '=B2': 'Febrero toma el sueldo de enero. Copia la fórmula hacia la derecha: cada mes toma el valor del mes anterior. Si un mes cambia el sueldo, solo modificas ese mes.',
        '=B3': 'Lo mismo para el sueldo de mamá.', '=B4': 'Lo mismo para tu sueldo.',
        '=L2': 'Diciembre toma el valor de noviembre (columna L).', '=L3': 'Diciembre toma el valor de noviembre.', '=L4': 'Diciembre toma el valor de noviembre.',
        '=SUMA(B2:M2)': 'Total anual del sueldo de papá: suma de enero (B) a diciembre (M).',
        '=SUMA(B3:M3)': 'Total anual del sueldo de mamá.', '=SUMA(B4:M4)': 'Total anual de tu sueldo.',
        '=SUMA(B2:B4)': 'Ingresos totales de enero: suma de los tres sueldos de esa columna.',
        '=SUMA(C2:C4)': 'Ingresos totales de febrero. Copia la fórmula hacia la derecha para los demás meses.',
        '=SUMA(M2:M4)': 'Ingresos totales de diciembre.',
        '=SUMA(B5:M5)': 'Ingresos totales del año.'
      }
    },
    2: {
      header: ['', 'A', 'B', 'C', '…', 'M', 'N'],
      rows: [
        ['1', { t: 'Egresos', cls: 'lbl' }, { t: 'Ene', cls: 'lbl' }, { t: 'Feb', cls: 'lbl' }, '…', { t: 'Dic', cls: 'lbl' }, { t: 'Total anual', cls: 'lbl' }],
        ['2', { t: 'Renta', cls: 'lbl' }, 'dato', 'dato', '…', 'dato', '=SUMA(B2:M2)'],
        ['3', { t: 'Alimentos', cls: 'lbl' }, 'dato', 'dato', '…', 'dato', '=SUMA(B3:M3)'],
        ['4–8', { t: 'Transporte, agua, luz, TV, internet', cls: 'lbl' }, 'dato', 'dato', '…', 'dato', '…'],
        ['9', { t: 'Hipoteca', cls: 'lbl' }, 'dato', '=B9', '…', '=L9', '=SUMA(B9:M9)'],
        ['10', { t: 'Egresos totales', cls: 'lbl' }, '=SUMA(B2:B9)', '=SUMA(C2:C9)', '…', '=SUMA(M2:M9)', '=SUMA(B10:M10)']
      ],
      FX: {
        '=SUMA(B2:M2)': 'Total anual de la renta. Haz lo mismo en cada fila de egresos.',
        '=SUMA(B3:M3)': 'Total anual de alimentos.',
        '=B9': 'La hipoteca es igual cada mes: febrero toma el valor de enero. Copia hacia la derecha.',
        '=L9': 'Diciembre toma el valor de noviembre.',
        '=SUMA(B9:M9)': 'Total anual de la hipoteca.',
        '=SUMA(B2:B9)': 'Egresos totales de enero: suma de todas las filas de gasto, de la 2 a la 9.',
        '=SUMA(C2:C9)': 'Egresos totales de febrero. Copia hacia la derecha.',
        '=SUMA(M2:M9)': 'Egresos totales de diciembre.',
        '=SUMA(B10:M10)': 'Egresos totales del año.'
      }
    },
    3: {
      header: ['', 'A', 'B', 'C', '…', 'M', 'N'],
      rows: [
        ['1', '', { t: 'Ene', cls: 'lbl' }, { t: 'Feb', cls: 'lbl' }, '…', { t: 'Dic', cls: 'lbl' }, { t: 'Total anual', cls: 'lbl' }],
        ['2', { t: 'Ingresos', cls: 'lbl' }, '=Hoja1!B5', '=Hoja1!C5', '…', '=Hoja1!M5', '=SUMA(B2:M2)'],
        ['3', { t: 'Egresos', cls: 'lbl' }, '=Hoja2!B10', '=Hoja2!C10', '…', '=Hoja2!M10', '=SUMA(B3:M3)'],
        ['4', { t: 'Saldo', cls: 'lbl' }, '=B2-B3', '=C2-C3', '…', '=M2-M3', '=SUMA(B4:M4)'],
        ['5', { t: 'Ahorro acumulado', cls: 'lbl' }, '=B4', '=B5+C4', '…', '=L5+M4', '']
      ],
      FX: {
        '=Hoja1!B5': 'Trae los ingresos totales de enero desde la Hoja 1. No vuelvas a escribir el número: así, si cambia en la Hoja 1, cambia aquí.',
        '=Hoja1!C5': 'Ingresos totales de febrero desde la Hoja 1.', '=Hoja1!M5': 'Ingresos totales de diciembre desde la Hoja 1.',
        '=Hoja2!B10': 'Trae los egresos totales de enero desde la Hoja 2.',
        '=Hoja2!C10': 'Egresos totales de febrero desde la Hoja 2.', '=Hoja2!M10': 'Egresos totales de diciembre desde la Hoja 2.',
        '=SUMA(B2:M2)': 'Ingresos del año.', '=SUMA(B3:M3)': 'Egresos del año.', '=SUMA(B4:M4)': 'Saldo del año: lo que sobró (o faltó) en total.',
        '=B2-B3': 'Saldo de enero = ingresos − egresos.', '=C2-C3': 'Saldo de febrero. Copia hacia la derecha.', '=M2-M3': 'Saldo de diciembre.',
        '=B4': 'El ahorro acumulado de enero es el saldo de enero.',
        '=B5+C4': 'Ahorro acumulado de febrero = lo acumulado hasta enero + el saldo de febrero. Copia hacia la derecha.',
        '=L5+M4': 'Ahorro acumulado de diciembre: lo que juntarías en todo el año.'
      }
    },
    4: {
      header: ['', 'A', 'B'],
      rows: [
        ['1', { t: 'Precio por caja', cls: 'lbl' }, 'dato'],
        ['2', { t: 'Número de cajas', cls: 'lbl' }, 'dato'],
        ['3', { t: 'Costo total', cls: 'lbl' }, '=B1*B2'],
        ['4', { t: 'Ahorro acumulado a mayo', cls: 'lbl' }, '=Hoja3!F5'],
        ['5', { t: '¿Alcanza en 5 meses?', cls: 'lbl' }, '=SI(B4>=B3,"Sí alcanza","No alcanza")'],
        ['6', { t: 'Tasa de interés anual', cls: 'lbl' }, 'dato %'],
        ['7', { t: 'Plazo (meses)', cls: 'lbl' }, 'dato'],
        ['8', { t: 'Pago mensual', cls: 'lbl' }, '=PAGO(B6/12,B7,-B3)'],
        ['9', { t: 'Total pagado a crédito', cls: 'lbl' }, '=B8*B7'],
        ['10', { t: 'Intereses pagados', cls: 'lbl' }, '=B9-B3']
      ],
      FX: {
        '=B1*B2': 'Costo total = precio por caja × número de cajas.',
        '=Hoja3!F5': 'Trae el ahorro acumulado de la columna F (mayo, el quinto mes) de la Hoja 3.',
        '=SI(B4>=B3,"Sí alcanza","No alcanza")': 'Compara el ahorro acumulado con el costo y escribe la respuesta. Justifica después con las dos cifras.',
        '=PAGO(B6/12,B7,-B3)': 'Calcula la anualidad: tasa mensual (anual ÷ 12), número de pagos y monto. El signo menos hace que el resultado salga positivo.',
        '=B8*B7': 'Total pagado = pago mensual × número de pagos.',
        '=B9-B3': 'Lo que pagas de más por comprar a crédito.'
      }
    }
  };
  function showS5(k) { renderSheet('sheet5', 'ftext5', 'fexp5', S5[k].header, S5[k].rows, S5[k].FX); }
  document.querySelectorAll('#s5Tabs button').forEach((b) => b.addEventListener('click', () => { setPressed('#s5Tabs', b); showS5(b.dataset.s); }));
  showS5(1);

  buildQuiz('qz5', [
    {
      p: 'Una familia tiene un saldo de $3 000 cada mes y quiere juntar $10 000. ¿Cómo sabe en qué mes lo logra?',
      o: ['Compara $10 000 con el saldo de un mes.', 'Suma los saldos mes por mes (ahorro acumulado) hasta llegar a $10 000.', 'Divide $3 000 entre 12.'],
      a: 1,
      f: ['El saldo de un mes es lo que sobra ese mes; la meta se alcanza juntando varios meses.', 'Correcto. El ahorro acumulado muestra cuánto llevas juntado.', 'Dividir entre 12 no responde cuándo se junta la meta.']
    },
    {
      p: '¿Qué es una anualidad?',
      o: ['Un pago que se hace una vez al año.', 'Una serie de pagos iguales hechos cada cierto tiempo, con la misma tasa.', 'El interés total de un crédito.'],
      a: 1,
      f: ['El nombre confunde, pero no tiene que ser anual: una mensualidad también es una anualidad.', 'Correcto. Por ejemplo, 12 mensualidades iguales de un crédito.', 'El interés total es otra cosa: la suma de lo que pagas de más.']
    },
    {
      p: 'En una anualidad, ¿por qué la parte de interés de cada pago va bajando?',
      o: ['Porque el banco hace un descuento cada mes.', 'Porque el interés se calcula sobre lo que aún debes, y cada mes debes menos.', 'Porque el pago mensual baja.'],
      a: 1,
      f: ['No hay descuento; es el saldo el que disminuye.', 'Correcto. Menos deuda, menos interés; por eso sube el abono a capital.', 'El pago es igual todos los meses; lo que cambia es cómo se reparte.']
    }
  ]);
  buildChecklist('lista5');

  /* ===================== AI6 · Capitalización ===================== */
  const CAPS = [['Anual', 1], ['Semestral', 2], ['Trimestral', 4], ['Mensual', 12]];
  const CAP0 = 40000;
  const montoComp = (C, r, m, t = 1) => C * Math.pow(1 + r / m, m * t);
  function renderCaps() {
    const r = +$('kR').value / 100;
    $('vkR').textContent = pct(r * 100);
    const box = $('capCards');
    box.textContent = '';
    const res = CAPS.map(([n, m]) => ({ n, m, M: montoComp(CAP0, r, m) }));
    const best = Math.max(...res.map((x) => x.M));
    res.forEach((x) => {
      const d = document.createElement('div');
      d.className = 'capcard' + (Math.abs(x.M - best) < 0.005 ? ' top' : '');
      d.innerHTML = `<small>${x.n} (m = ${x.m})</small><b>${money2(x.M)}</b><span class="r">+${money2(x.M - CAP0)}</span>`;
      box.appendChild(d);
    });
  }
  $('kR').addEventListener('input', renderCaps);
  renderCaps();

  /* ===================== AI6 · Instituciones ===================== */
  const RISK = { 1: ['Bajo', 'b'], 2: ['Medio-bajo', 'mb'], 3: ['Medio-alto', 'ma'] };
  const INST = [
    { n: 'Banco Norte', r: 7.5, cap: 'Anual', m: 1, tipo: 'Pagaré a plazo fijo', k: 1 },
    { n: 'Fondo Horizonte', r: 8.4, cap: 'Mensual', m: 12, tipo: 'Fondo mixto', k: 3 },
    { n: 'Caja Segura', r: 7.2, cap: 'Mensual', m: 12, tipo: 'Certificado bancario', k: 1 },
    { n: 'Invierte Más', r: 6.9, cap: 'Trimestral', m: 4, tipo: 'Fondo de deuda', k: 2 },
    { n: 'Ahorra Ya', r: 5.8, cap: 'Semestral', m: 2, tipo: 'Cuenta de inversión', k: 1 }
  ].map((x) => ({ ...x, M: montoComp(CAP0, x.r / 100, x.m) }));
  let calcDone = false, riskMax = 3;
  const pickInst = () => INST.filter((x) => x.k <= riskMax).reduce((a, b) => (b.M > a.M ? b : a));

  function renderInst() {
    const body = $('instBody');
    body.textContent = '';
    const pick = pickInst();
    INST.forEach((x) => {
      const tr = body.insertRow();
      if (calcDone && x === pick) tr.className = 'pick';
      else if (calcDone && x.k > riskMax) tr.className = 'dim';
      tr.insertCell().textContent = x.n;
      const c1 = tr.insertCell(); c1.className = 'num'; c1.textContent = pct(x.r);
      tr.insertCell().textContent = `${x.cap} (m = ${x.m})`;
      tr.insertCell().textContent = x.tipo;
      const c4 = tr.insertCell(); c4.innerHTML = `<span class="risk ${RISK[x.k][1]}">${RISK[x.k][0]}</span>`;
      const c5 = tr.insertCell(); c5.className = 'num'; c5.textContent = calcDone ? money2(x.M) : '—';
      const c6 = tr.insertCell(); c6.className = 'num'; c6.textContent = calcDone ? money2(x.M - CAP0) : '—';
    });
    if (!calcDone) {
      $('iMsg').textContent = 'Presiona “Calcular rendimientos” para ver el monto final de cada institución.';
    } else {
      const top = INST.reduce((a, b) => (b.M > a.M ? b : a));
      let m = `Con la opción de riesgo elegida, la de mayor rendimiento es <b>${pick.n}</b>: ${money2(pick.M - CAP0)} (${RISK[pick.k][0].toLowerCase()}).`;
      if (pick !== top) m += ` Renuncias a ${money2(top.M - pick.M)} frente a ${top.n} a cambio de menos riesgo.`;
      const bn = INST[0], cs = INST[2];
      m += `<br><i>Observa ${bn.n} y ${cs.n}: ${cs.n} tiene menor tasa, pero capitaliza cada mes, y la diferencia entre ambas es de solo ${money2(Math.abs(bn.M - cs.M))}.</i>`;
      $('iMsg').innerHTML = m;
    }
    renderFlow();
  }
  $('iCalc').addEventListener('click', () => { calcDone = true; renderInst(); });
  document.querySelectorAll('#riskPick .pill').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#riskPick .pill').forEach((x) => x.classList.toggle('on', x === b));
    riskMax = +b.dataset.k;
    renderInst();
  }));

  /* ===================== AI6 · Enganche y amortización ===================== */
  const AUTO = 210000;
  let shown = 0;
  function financiado() { return AUTO - pickInst().M; }

  function renderFlow() {
    const p = pickInst();
    $('flow').innerHTML =
      `<div class="fb">Capital<b>${money(CAP0)}</b></div><span class="ar">→</span>` +
      `<div class="fb">Inversión en ${p.n}<b>+${money2(p.M - CAP0)}</b></div><span class="ar">→</span>` +
      `<div class="fb">Enganche<b>${money2(p.M)}</b></div><span class="ar">→</span>` +
      `<div class="fb">Auto ${money(AUTO)} − enganche<b>${money2(financiado())}</b><small>monto financiado</small></div>`;
    shown = 0;
    renderAmort();
    renderPlazos();
  }

  function schedule(P, i, n) {
    const R = pago(P, i, n);
    const rows = [];
    let s = P;
    for (let k = 1; k <= n; k++) {
      const int = s * i, ab = R - int, fin = s - ab;
      rows.push({ k, ini: s, R, int, ab, fin });
      s = fin;
    }
    return { R, rows };
  }

  function renderAmort() {
    const P = financiado(), r = +$('tR').value, n = +$('tN').value, i = r / 100;
    const { R, rows } = schedule(P, i, n);
    $('tPay').innerHTML = `Monto financiado <b>${money2(P)}</b> · tasa mensual ${pct(r)} = <b>${i.toFixed(2)}</b> (ya es mensual, no se divide entre 12) · ${n} pagos → pago mensual (anualidad) = <b>${money2(R)}</b>`;
    const body = $('tBody');
    body.textContent = '';
    rows.slice(0, shown).forEach((x, idx) => {
      const tr = body.insertRow();
      if (idx === shown - 1) tr.className = 'hl';
      [x.k, money2(x.ini), money2(x.R), money2(x.int), money2(x.ab), money2(x.fin)].forEach((v) => { tr.insertCell().textContent = v; });
    });
    const foot = $('tFoot');
    foot.textContent = '';
    if (shown === n) {
      const tp = R * n, ti = tp - P;
      const add = (label, v) => { const tr = foot.insertRow(); const th = document.createElement('th'); th.colSpan = 5; th.textContent = label; tr.appendChild(th); const td = document.createElement('th'); td.textContent = v; tr.appendChild(td); };
      add(`Total de los ${n} pagos`, money2(tp));
      add('Intereses pagados (total − monto financiado)', money2(ti));
      add('Costo total del auto (enganche + pagos)', money2(pickInst().M + tp));
    }
    $('tNext').disabled = shown >= n;
    $('tAll').disabled = shown >= n;
    const e = $('tExplain');
    if (!shown) {
      e.textContent = 'Presiona “Calcular el siguiente mes” para ver de dónde sale cada columna.';
    } else {
      const x = rows[shown - 1];
      const origen = x.k === 1 ? 'El saldo inicial del mes 1 es el monto financiado.' : `El saldo inicial del mes ${x.k} es el saldo final del mes ${x.k - 1}.`;
      e.innerHTML = `${origen}<br>
        <span class="chip out">Interés</span> ${money2(x.ini)} × ${i.toFixed(2)} = <b>${money2(x.int)}</b> &nbsp;·&nbsp;
        <span class="chip in">Abono</span> ${money2(x.R)} − ${money2(x.int)} = <b>${money2(x.ab)}</b><br>
        <span class="chip base">Saldo final</span> ${money2(x.ini)} − ${money2(x.ab)} = <b>${money2(x.fin)}</b>` +
        (shown === n ? '<br><i>El saldo llegó a cero: el crédito quedó pagado.</i>' : '');
    }
  }
  $('tNext').addEventListener('click', () => { shown = Math.min(shown + 1, +$('tN').value); renderAmort(); });
  $('tAll').addEventListener('click', () => { shown = +$('tN').value; renderAmort(); });
  $('tReset').addEventListener('click', () => { shown = 0; renderAmort(); });
  ['tR', 'tN'].forEach((id) => $(id).addEventListener('change', () => { shown = 0; renderAmort(); renderPlazos(); }));

  function renderPlazos() {
    const P = financiado(), r = +$('tR').value, i = r / 100;
    const box = $('vsPlazos');
    box.textContent = '';
    [24, 48].forEach((n) => {
      const R = pago(P, i, n), tp = R * n;
      const d = document.createElement('div');
      d.className = 'opt';
      d.innerHTML = `<h4>${n} meses</h4><p>Pago mensual: <b>${money2(R)}</b><br>Total pagado: <b>${money2(tp)}</b><br>Intereses: <b>${money2(tp - P)}</b></p>`;
      box.appendChild(d);
    });
    const p = document.createElement('p');
    p.className = 'small';
    p.style.gridColumn = '1 / -1';
    p.textContent = `Ejemplo con ${money2(P)} financiados a ${pct(r)} mensual (la tasa elegida en el paso 4).`;
    box.appendChild(p);
  }

  /* ===================== AI6 · Hojas de cálculo ===================== */
  const S6 = {
    1: {
      header: ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      rows: [
        ['1', { t: 'Institución', cls: 'lbl' }, { t: 'Tasa anual', cls: 'lbl' }, { t: 'Capitalización', cls: 'lbl' }, { t: 'm', cls: 'lbl' }, { t: 'Monto final', cls: 'lbl' }, { t: 'Rendimiento', cls: 'lbl' }, { t: 'Capital', cls: 'lbl' }, 'dato'],
        ['2', 'dato', 'dato %', 'Anual', { t: '1', cls: 'inp' }, '=$H$1*(1+B2/D2)^(D2*1)', '=E2-$H$1', '', ''],
        ['3', 'dato', 'dato %', 'Trimestral', { t: '4', cls: 'inp' }, '… copia la fila 2 hacia abajo …', '', '', ''],
        ['4', 'dato', 'dato %', 'Mensual', { t: '12', cls: 'inp' }, '', '', '', ''],
        ['5', 'dato', 'dato %', 'Semestral', { t: '2', cls: 'inp' }, '', '', '', ''],
        ['7', { t: 'Con función', cls: 'lbl' }, '', '', '', '=VF(B2/D2,D2*1,0,-$H$1)', '', '', '']
      ],
      FX: {
        '=$H$1*(1+B2/D2)^(D2*1)': 'Monto final con interés compuesto: capital × (1 + tasa ÷ m) elevado a (m × años). El plazo es 1 año. $H$1 queda fijo al copiar.',
        '=E2-$H$1': 'Rendimiento = monto final − capital: lo que ganas por invertir.',
        '=VF(B2/D2,D2*1,0,-$H$1)': 'Otra forma de obtener el monto final: VF calcula el valor futuro con tasa por periodo (B2/D2), número de periodos (D2×1) y capital. Debe dar lo mismo que la columna E.'
      }
    },
    2: {
      header: ['', 'A', 'B', 'C', 'D', 'E', 'F'],
      rows: [
        ['1', { t: 'Precio del auto', cls: 'lbl' }, 'dato', '', '', '', ''],
        ['2', { t: 'Enganche', cls: 'lbl' }, '=Hoja1!E2', '', '', '', ''],
        ['3', { t: 'Monto financiado', cls: 'lbl' }, '=B1-B2', '', '', '', ''],
        ['4', { t: 'Tasa mensual', cls: 'lbl' }, 'dato %', '', '', '', ''],
        ['5', { t: 'Plazo (meses)', cls: 'lbl' }, 'dato', '', '', '', ''],
        ['6', { t: 'Pago mensual', cls: 'lbl' }, '=PAGO(B4,B5,-B3)', '', '', '', ''],
        ['8', { t: 'Mes', cls: 'lbl' }, { t: 'Saldo inicial', cls: 'lbl' }, { t: 'Pago', cls: 'lbl' }, { t: 'Interés', cls: 'lbl' }, { t: 'Abono a capital', cls: 'lbl' }, { t: 'Saldo final', cls: 'lbl' }],
        ['9', '1', '=B3', '=$B$6', '=B9*$B$4', '=C9-D9', '=B9-E9'],
        ['10', '=A9+1', '=F9', '=$B$6', '=B10*$B$4', '=C10-D10', '=B10-E10'],
        ['11', { t: '… copia la fila 10 hacia abajo hasta el mes 48 (fila 56) …', span: 6 }],
        ['57', { t: 'Totales', cls: 'lbl' }, '', '=SUMA(C9:C56)', '=SUMA(D9:D56)', '', ''],
        ['58', { t: 'Costo total del auto', cls: 'lbl' }, '=B2+C57', '', '', '', '']
      ],
      FX: {
        '=Hoja1!E2': 'El enganche es el monto final de la inversión elegida. Cambia E2 por la fila de la institución que escogiste.',
        '=B1-B2': 'Monto financiado = precio − enganche. Es lo que pides prestado.',
        '=PAGO(B4,B5,-B3)': 'Pago mensual (anualidad): tasa mensual, número de pagos y monto financiado. La tasa ya es mensual, por eso no se divide entre 12.',
        '=B3': 'El primer mes empieza con todo el monto financiado.',
        '=$B$6': 'El pago es igual todos los meses: siempre lee la celda B6.',
        '=B9*$B$4': 'Interés del mes = saldo inicial × tasa mensual. $B$4 queda fijo al copiar la fórmula.',
        '=C9-D9': 'Abono a capital = pago − interés. Es lo que realmente reduce tu deuda.',
        '=B9-E9': 'Saldo final = saldo inicial − abono a capital.',
        '=A9+1': 'Número de mes.',
        '=F9': 'Clave: el saldo inicial de un mes es el saldo final del mes anterior.',
        '=B10*$B$4': 'Interés del mes 2, ahora sobre un saldo menor.',
        '=C10-D10': 'Abono a capital del mes 2.',
        '=B10-E10': 'Saldo final del mes 2.',
        '=SUMA(C9:C56)': 'Total pagado en la tabla de 48 meses (filas 9 a 56). En la copia de 24 meses, la tabla termina en la fila 32 y la suma es =SUMA(C9:C32).',
        '=SUMA(D9:D56)': 'Total de intereses pagados en 48 meses. En la tabla de 24 meses: =SUMA(D9:D32).',
        '=B2+C57': 'Costo total del auto = enganche + todos los pagos.'
      }
    }
  };
  function showS6(k) { renderSheet('sheet6', 'ftext6', 'fexp6', S6[k].header, S6[k].rows, S6[k].FX); }
  document.querySelectorAll('#s6Tabs button').forEach((b) => b.addEventListener('click', () => { setPressed('#s6Tabs', b); showS6(b.dataset.s); }));
  showS6(1);

  buildQuiz('qz6', [
    {
      p: 'Dos inversiones pagan 7 % anual. Una capitaliza cada mes y la otra una vez al año. ¿Cuál rinde más en un año?',
      o: ['La que capitaliza cada mes.', 'La que capitaliza una vez al año.', 'Rinden lo mismo porque la tasa es igual.'],
      a: 0,
      f: ['Correcto. Los intereses de cada mes también generan intereses.', 'Con capitalización anual, los intereses no se reinvierten durante el año.', 'La tasa es igual, pero la capitalización cambia el resultado.']
    },
    {
      p: 'El dinero es para el enganche de un auto. La institución que más rinde tiene riesgo medio-alto. ¿Qué debes considerar?',
      o: ['Elegir siempre la de mayor rendimiento.', 'Que podrías perder parte del dinero y quedarte sin enganche; compara rendimiento con riesgo.', 'Elegir la de menor tasa para no arriesgar.'],
      a: 1,
      f: ['El rendimiento no está garantizado si el riesgo es alto.', 'Correcto. La decisión se justifica con rendimiento y riesgo juntos.', 'No hace falta elegir la menor tasa: hay opciones de bajo riesgo con buen rendimiento.']
    },
    {
      p: 'Si el plazo del crédito cambia de 24 a 48 meses, ¿qué pasa?',
      o: ['Baja la mensualidad y suben los intereses totales.', 'Baja la mensualidad y bajan los intereses.', 'Sube la mensualidad.'],
      a: 0,
      f: ['Correcto. Pagas menos cada mes, pero durante más tiempo.', 'Más meses debiendo significa más intereses.', 'Al repartir la deuda en más meses, el pago mensual baja.']
    }
  ]);
  buildChecklist('lista6');

  renderInst();
})();
