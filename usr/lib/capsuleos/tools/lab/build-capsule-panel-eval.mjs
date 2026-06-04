#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const driver = fs.readFileSync(path.join(__dirname, 'capsule-panel-driver.js'), 'utf8');
const snippet = fs.readFileSync(path.join(__dirname, 'capsule-probe-snippet.js'), 'utf8');
let probeBody = snippet.replace(/\(function capsuleProbeState\(\) \{/, 'function probeState() {');
probeBody = probeBody.split('}());').join('}');

const steps = [
  { step: 0, actions: [['open-launcher', 'nemo']] },
  { step: 1, actions: [['open-launcher', 'firefox'], ['focus-launcher', 'firefox']] },
  { step: 2, actions: [['open-launcher', 'terminal'], ['focus-launcher', 'terminal']] },
  { step: 3, actions: [['focus-launcher', 'nemo']] },
  { step: 4, actions: [['minimize-launcher', 'nemo']] },
  { step: 5, actions: [['nemo-sidebar', 'Documents']] },
];

const expr = `(async function() {
  ${driver}
  ${probeBody}
  function wait(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
  CapsulePanelDriver.resetPanel();
  await wait(400);
  var steps = ${JSON.stringify(steps)};
  var out = [];
  for (var i = 0; i < steps.length; i++) {
    var st = steps[i];
    for (var j = 0; j < st.actions.length; j++) {
      var a = st.actions[j];
      CapsulePanelDriver.runAction(a[0], a[1]);
      await wait(550);
    }
    await wait(350);
    out.push({ step: st.step, state: probeState() });
  }
  return out;
})()`;

process.stdout.write(expr);
