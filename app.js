// app.js (deferred, no inline script)
(async () => {
  // wait for pyodide to be available from the external script
  if (typeof loadPyodide !== 'function') {
    console.error('Pyodide not loaded');
    return;
  }

  const pyodide = await loadPyodide({indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.4/full/"});
  await pyodide.loadPackage(['micropip']);
  const micropip = pyodide.pyimport('micropip');
  await micropip.install('numpy'); // simulate.py uses numpy

  // fetch the python module file (simulate.py) and run it
  const pySource = await fetch('simulate.py').then(r => {
    if (!r.ok) throw new Error('Failed to fetch simulate.py');
    return r.text();
  });
  await pyodide.runPythonAsync(pySource);
  const simulateLorenz = pyodide.globals.get('simulateLorenz');

  // DOM elements
  const elSigma = document.getElementById('slider_sigma');
  const elRho = document.getElementById('slider_rho');
  const elBeta = document.getElementById('slider_beta');
  const elX = document.getElementById('slider_x');
  const elY = document.getElementById('slider_y');
  const elZ = document.getElementById('slider_z');
  const elDT = document.getElementById('slider_dt');
  const elN = document.getElementById('slider_n');

  const valSigma = document.getElementById('val_sigma');
  const valRho = document.getElementById('val_rho');
  const valBeta = document.getElementById('val_beta');
  const valX = document.getElementById('val_x');
  const valY = document.getElementById('val_y');
  const valZ = document.getElementById('val_z');
  const valDT = document.getElementById('val_dt');
  const valN = document.getElementById('val_n');

  const runBtn = document.getElementById('run');
  const outPre = document.getElementById('py-output');

  function updateLabels(){
    valSigma.textContent = parseFloat(elSigma.value).toFixed(3);
    valRho.textContent = parseFloat(elRho.value).toFixed(3);
    valBeta.textContent = parseFloat(elBeta.value);
    valX.textContent = parseFloat(elX.value);
    valY.textContent = parseFloat(elY.value);
    valZ.textContent = parseFloat(elZ.value);
    valDT.textContent = parseFloat(elDT.value);
    valN.textContent = elN.value;
  }
  [elSigma, elRho, elBeta, elX, elY, elZ, elDT, elN].forEach(el=> el.addEventListener('input', updateLabels));
  updateLabels();

  async function runCompute(){
    runBtn.disabled = true;
    outPre.style.display = 'none';
    try {
      const sigma = parseFloat(elSigma.value);
      const rho = parseFloat(elRho.value);
      const beta = parseFloat(elBeta.value);
      const dt = parseFloat(elDT.value);
      const n = parseInt(elN.value);
      const x0 = parseFloat(elX.value);
      const y0 = parseFloat(elY.value);
      const z0 = parseFloat(elZ.value);

      const res_py = simulateLorenz(sigma, rho, beta, dt, n, x0, y0, z0);
      const obj = res_py.toJs({dict_converter: Object});
      res_py.destroy && res_py.destroy();

      // if obj is an array of [key, value] pairs:
      const dict = Array.isArray(obj) ? Object.fromEntries(obj) : obj;

      // if values might be PyProxies, convert them
      const toJsSafe = v => (v && typeof v.toJs === 'function') ? v.toJs({dict_converter: Object}) : v;

      const x = toJsSafe(dict.x);
      const y = toJsSafe(dict.y);
      const z = toJsSafe(dict.z);

      console.log({obj, x: obj.x, y: obj.y, z: obj.z, isArrayX: Array.isArray(obj.x)});

      const trace = { x: x, y: y, z: z, mode: 'lines', type: 'scatter3d', line:{width:2} };
      const layout = { title: 'Lorenz attractor', margin:{t:40} };
      Plotly.react('plot', [trace], layout, {responsive:true});
      // Plotly.react('plot', [{x:[0,1,2], y:[0,1,0], z:[0,0,1], mode:'lines', type:'scatter3d'}], {margin:{t:40}});

    } catch(err){
      outPre.style.display = 'block';
      outPre.textContent = String(err);
      console.error(err);
    } finally {
      runBtn.disabled = false;
    }
  }

  runBtn.addEventListener('click', runCompute);
  let debounceTimer = null;
  [elSigma, elRho, elBeta, elX, elY, elZ, elDT, elN].forEach(el=>{
    el.addEventListener('change', () => {
      if(debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(runCompute, 200);
    });
  });

  // initial run
  runCompute();
})();
