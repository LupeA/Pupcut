(() => {
  "use strict";

  /** ASME B16.9 center-to-end takeouts (inches). null = not standard at that size. */
  const BW = {
    sizes: ["0.5", "0.75", "1", "1.25", "1.5", "2", "2.5", "3", "4", "6", "8", "10", "12"],
    labels: {
      "0.5": '1/2"',
      "0.75": '3/4"',
      "1": '1"',
      "1.25": '1-1/4"',
      "1.5": '1-1/2"',
      "2": '2"',
      "2.5": '2-1/2"',
      "3": '3"',
      "4": '4"',
      "6": '6"',
      "8": '8"',
      "10": '10"',
      "12": '12"',
    },
    fittings: {
      none: { name: "None / open end", values: {} },
      lr90: {
        name: "LR 90° elbow",
        values: {
          "0.5": 1.5, "0.75": 1.5, "1": 1.5, "1.25": 1.88, "1.5": 2.25,
          "2": 3, "2.5": 3.75, "3": 4.5, "4": 6, "6": 9, "8": 12, "10": 15, "12": 18,
        },
      },
      lr45: {
        name: "LR 45° elbow",
        values: {
          "0.5": 0.62, "0.75": 0.75, "1": 0.88, "1.25": 1, "1.5": 1.12,
          "2": 1.38, "2.5": 1.75, "3": 2, "4": 2.5, "6": 3.75, "8": 5, "10": 6.25, "12": 7.5,
        },
      },
      sr90: {
        name: "SR 90° elbow",
        values: {
          "0.5": null, "0.75": null, "1": 1, "1.25": 1.25, "1.5": 1.5,
          "2": 2, "2.5": 2.5, "3": 3, "4": 4, "6": 6, "8": 8, "10": 10, "12": 12,
        },
      },
      tee: {
        name: "Tee (run)",
        values: {
          "0.5": 1, "0.75": 1.12, "1": 1.5, "1.25": 1.88, "1.5": 2.25,
          "2": 2.5, "2.5": 3, "3": 3.38, "4": 4.12, "6": 5.62, "8": 7, "10": 8.5, "12": 10,
        },
      },
      reducer: {
        name: "Reducer (large end)",
        values: {
          "0.5": null, "0.75": 1.5, "1": 2, "1.25": 2, "1.5": 2.5,
          "2": 3, "2.5": 3.5, "3": 3.5, "4": 4, "6": 5.5, "8": 6, "10": 7, "12": 8,
        },
      },
      custom: { name: "Custom takeoff…", values: {} },
    },
  };

  /**
   * Threaded fitting allowances (inches): approx center-to-end minus engagement.
   * Couplings use thread engagement only.
   */
  const TH = {
    sizes: ["0.5", "0.75", "1", "1.25", "1.5", "2", "2.5", "3", "4"],
    labels: BW.labels,
    fittings: {
      none: { name: "None / open end", values: {} },
      el90: {
        name: "90° elbow",
        values: {
          "0.5": 0.94, "0.75": 1.06, "1": 1.06, "1.25": 1.19, "1.5": 1.31,
          "2": 1.46, "2.5": 1.73, "3": 1.97, "4": 2.36,
        },
      },
      el45: {
        name: "45° elbow",
        values: {
          "0.5": 0.55, "0.75": 0.63, "1": 0.7, "1.25": 0.82, "1.5": 0.9,
          "2": 1.05, "2.5": 1.2, "3": 1.35, "4": 1.6,
        },
      },
      tee: {
        name: "Tee",
        values: {
          "0.5": 0.94, "0.75": 1.06, "1": 1.06, "1.25": 1.19, "1.5": 1.31,
          "2": 1.46, "2.5": 1.73, "3": 1.97, "4": 2.36,
        },
      },
      coupling: {
        name: "Coupling / engagement",
        values: {
          "0.5": 0.53, "0.75": 0.55, "1": 0.68, "1.25": 0.71, "1.5": 0.72,
          "2": 0.76, "2.5": 0.94, "3": 1.0, "4": 1.06,
        },
      },
      custom: { name: "Custom takeoff…", values: {} },
    },
  };

  const els = {
    jointType: document.getElementById("jointType"),
    nps: document.getElementById("nps"),
    fitA: document.getElementById("fitA"),
    fitB: document.getElementById("fitB"),
    customA: document.getElementById("customA"),
    customB: document.getElementById("customB"),
    customAWrap: document.getElementById("customAWrap"),
    customBWrap: document.getElementById("customBWrap"),
    takeoffA: document.getElementById("takeoffA"),
    takeoffB: document.getElementById("takeoffB"),
    overall: document.getElementById("overall"),
    gap: document.getElementById("gap"),
    weldCount: document.getElementById("weldCount"),
    weldRow: document.getElementById("weldRow"),
    resultCard: document.getElementById("resultCard"),
    resultMain: document.getElementById("resultMain"),
    resultSub: document.getElementById("resultSub"),
    copyBtn: document.getElementById("copyBtn"),
    breakdown: document.getElementById("breakdown"),
    diagram: document.getElementById("diagram"),
    labelA: document.getElementById("labelA"),
    labelB: document.getElementById("labelB"),
    valueA: document.getElementById("valueA"),
    valueB: document.getElementById("valueB"),
    overallDim: document.getElementById("overallDim"),
    pupValue: document.getElementById("pupValue"),
    formulaChip: document.getElementById("formulaChip"),
  };

  function catalog() {
    return els.jointType.value === "th" ? TH : BW;
  }

  function parseLength(raw) {
    if (raw == null) return NaN;
    let s = String(raw).trim().toLowerCase().replace(/["in]/g, "").replace(/,/g, "");
    if (!s) return NaN;

    // 40-1/2 or 40 1/2 or 40 1/2"
    const mixed = s.match(/^(-?\d+)\s*[-\s]\s*(\d+)\s*\/\s*(\d+)$/);
    if (mixed) {
      const whole = Number(mixed[1]);
      const num = Number(mixed[2]);
      const den = Number(mixed[3]);
      if (!den) return NaN;
      const frac = num / den;
      return whole < 0 ? whole - frac : whole + frac;
    }

    const fracOnly = s.match(/^(-?)(\d+)\s*\/\s*(\d+)$/);
    if (fracOnly) {
      const sign = fracOnly[1] ? -1 : 1;
      const den = Number(fracOnly[3]);
      if (!den) return NaN;
      return (sign * Number(fracOnly[2])) / den;
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function toFraction(inches, maxDen = 16) {
    if (!Number.isFinite(inches)) return "—";
    const sign = inches < 0 ? "-" : "";
    const abs = Math.abs(inches);
    const whole = Math.floor(abs + 1e-9);
    let rem = abs - whole;
    if (rem < 1e-9) return `${sign}${whole}`;

    let bestN = 1;
    let bestD = 1;
    let bestErr = Math.abs(rem - 1);
    for (let d = 1; d <= maxDen; d *= 2) {
      const n = Math.round(rem * d);
      const err = Math.abs(rem - n / d);
      if (err < bestErr - 1e-12 || (Math.abs(err - bestErr) < 1e-12 && d < bestD)) {
        bestErr = err;
        bestN = n;
        bestD = d;
      }
    }

    if (bestN === 0) return `${sign}${whole}`;
    if (bestN === bestD) return `${sign}${whole + 1}`;
    if (whole === 0) return `${sign}${bestN}/${bestD}`;
    return `${sign}${whole} ${bestN}/${bestD}`;
  }

  function formatInches(inches) {
    if (!Number.isFinite(inches)) return "—";
    const frac = toFraction(inches);
    const dec = Number(inches.toFixed(3));
    return `${frac}" (${dec}")`;
  }

  function shortInches(inches) {
    if (!Number.isFinite(inches)) return "—";
    return `${toFraction(inches)}"`;
  }

  function fillSizes() {
    const cat = catalog();
    const prev = els.nps.value;
    els.nps.innerHTML = cat.sizes
      .map((s) => `<option value="${s}">${cat.labels[s] || s}</option>`)
      .join("");
    if (cat.sizes.includes(prev)) els.nps.value = prev;
    else els.nps.value = cat.sizes.includes("2") ? "2" : cat.sizes[0];
  }

  function fillFittings(select, preferred) {
    const cat = catalog();
    const keys = Object.keys(cat.fittings);
    const prev = preferred || select.value;
    select.innerHTML = keys
      .map((k) => `<option value="${k}">${cat.fittings[k].name}</option>`)
      .join("");
    if (keys.includes(prev)) select.value = prev;
    else select.value = keys.includes("lr90") ? "lr90" : keys.includes("el90") ? "el90" : keys[0];
  }

  function takeoffFor(side) {
    const cat = catalog();
    const nps = els.nps.value;
    const key = side === "A" ? els.fitA.value : els.fitB.value;
    const fitting = cat.fittings[key];
    if (!fitting) return { ok: false, reason: "Unknown fitting" };

    if (key === "none") return { ok: true, value: 0, name: fitting.name };
    if (key === "custom") {
      const raw = side === "A" ? els.customA.value : els.customB.value;
      const v = parseLength(raw);
      if (!Number.isFinite(v) || v < 0) {
        return { ok: false, reason: "Enter a custom takeoff" };
      }
      return { ok: true, value: v, name: "Custom" };
    }

    const tableVal = fitting.values[nps];
    if (tableVal == null) {
      return {
        ok: false,
        reason: `${fitting.name} not listed for ${cat.labels[nps] || nps}`,
      };
    }
    return { ok: true, value: tableVal, name: fitting.name };
  }

  function syncCustomVisibility() {
    els.customAWrap.hidden = els.fitA.value !== "custom";
    els.customBWrap.hidden = els.fitB.value !== "custom";
  }

  function syncJointUi() {
    const threaded = els.jointType.value === "th";
    els.weldRow.hidden = threaded;
    els.formulaChip.textContent = threaded
      ? "Cut = overall − A − B"
      : "Cut = overall − A − B − gaps";
    fillSizes();
    fillFittings(els.fitA, els.fitA.value);
    fillFittings(els.fitB, els.fitB.value);
    syncCustomVisibility();
    calculate();
  }

  function setResult(state, main, sub) {
    els.resultCard.dataset.state = state;
    els.resultMain.textContent = main;
    els.resultSub.textContent = sub;
    els.copyBtn.hidden = state !== "ready";
    els.diagram.classList.toggle("is-ready", state === "ready");
  }

  function calculate() {
    const a = takeoffFor("A");
    const b = takeoffFor("B");
    const overall = parseLength(els.overall.value);
    const gap = els.jointType.value === "bw" ? Number(els.gap.value) : 0;
    const welds = els.jointType.value === "bw" ? Number(els.weldCount.value) : 0;
    const gapTotal = gap * welds;

    els.labelA.textContent = a.name || "End A";
    els.labelB.textContent = b.name || "End B";
    els.valueA.textContent = a.ok ? shortInches(a.value) : "—";
    els.valueB.textContent = b.ok ? shortInches(b.value) : "—";
    els.takeoffA.textContent = a.ok
      ? `Takeoff: ${formatInches(a.value)}`
      : `Takeoff: ${a.reason}`;
    els.takeoffB.textContent = b.ok
      ? `Takeoff: ${formatInches(b.value)}`
      : `Takeoff: ${b.reason}`;
    els.overallDim.textContent = Number.isFinite(overall)
      ? `Overall ${shortInches(overall)}`
      : "Overall";

    if (!a.ok || !b.ok) {
      els.pupValue.textContent = "—";
      els.breakdown.hidden = true;
      setResult("idle", "Enter a run", a.ok ? b.reason : a.reason);
      return;
    }

    if (!Number.isFinite(overall)) {
      els.pupValue.textContent = "—";
      els.breakdown.hidden = true;
      setResult("idle", "Enter overall", "Type center-to-center length, like 40 1/2");
      return;
    }

    const pup = overall - a.value - b.value - gapTotal;
    els.pupValue.textContent = shortInches(pup);

    if (pup < 0) {
      els.breakdown.hidden = false;
      els.breakdown.innerHTML = `
        <strong>Negative cut length.</strong>
        Takeoffs (${shortInches(a.value)} + ${shortInches(b.value)}${
          gapTotal ? ` + gaps ${shortInches(gapTotal)}` : ""
        }) exceed overall ${shortInches(overall)}.
      `;
      setResult("error", shortInches(pup), "Check fittings, size, or overall length");
      return;
    }

    const jointNote =
      els.jointType.value === "bw"
        ? `Butt-weld · ${catalog().labels[els.nps.value]}`
        : `Threaded · ${catalog().labels[els.nps.value]}`;

    els.breakdown.hidden = false;
    els.breakdown.innerHTML = `
      <strong>${shortInches(overall)}</strong> overall
      − <strong>${shortInches(a.value)}</strong> ${a.name}
      − <strong>${shortInches(b.value)}</strong> ${b.name}
      ${
        gapTotal
          ? `− <strong>${shortInches(gapTotal)}</strong> gap (${shortInches(gap)} × ${welds})`
          : ""
      }
      = <strong>${formatInches(pup)}</strong>
    `;

    setResult("ready", shortInches(pup), `${jointNote} · ${formatInches(pup)}`);
    els.copyBtn.dataset.copy = String(Number(pup.toFixed(4)));
  }

  async function copyResult() {
    const text = els.copyBtn.dataset.copy;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      els.copyBtn.textContent = "Copied inches";
      setTimeout(() => {
        els.copyBtn.textContent = "Copy length";
      }, 1200);
    } catch {
      els.copyBtn.textContent = "Copy failed";
      setTimeout(() => {
        els.copyBtn.textContent = "Copy length";
      }, 1200);
    }
  }

  els.jointType.addEventListener("change", syncJointUi);
  els.nps.addEventListener("change", calculate);
  els.fitA.addEventListener("change", () => {
    syncCustomVisibility();
    calculate();
  });
  els.fitB.addEventListener("change", () => {
    syncCustomVisibility();
    calculate();
  });
  ["customA", "customB", "overall", "gap", "weldCount"].forEach((id) => {
    els[id].addEventListener("input", calculate);
    els[id].addEventListener("change", calculate);
  });
  els.copyBtn.addEventListener("click", copyResult);

  // Defaults: 3" BW, two LR 90s, 40 1/2 overall — matches the chart example
  fillSizes();
  fillFittings(els.fitA, "lr90");
  fillFittings(els.fitB, "lr90");
  els.nps.value = "3";
  els.overall.value = "40 1/2";
  syncCustomVisibility();
  calculate();
})();
