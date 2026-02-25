(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function parseNum(v){
    if (v == null) return NaN;
    const s = String(v).trim().replace(/,/g, "");
    if (s === "") return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function fmt(n){
    if (!Number.isFinite(n)) return "";
    const abs = Math.abs(n);
    const digits =
      abs === 0 ? 0 :
      abs < 0.001 ? 8 :
      abs < 0.01 ? 6 :
      abs < 1 ? 4 :
      abs < 100 ? 3 :
      abs < 1000 ? 2 : 2;

    return n.toLocaleString(undefined, { maximumFractionDigits: digits });
  }

  function bindRow(id, calcFn){
    const root = document.getElementById(id);
    if (!root) return;
    const form = $("form", root);
    // Support inputs + selects with data-in
    const ins = $$('[data-in]', root);
    const outs = $$("input[data-out]", root);
    if (!outs.length) return;
    const hint = $("span[data-hint]", root);

    const recalc = () => {
      const vals = ins.map(i => parseNum(i.value));
      const r = calcFn(...vals);

      const setOut = (el, v) => { el.value = Number.isFinite(v) ? fmt(v) : ""; };

      if (Array.isArray(r)) {
        outs.forEach((el, idx) => setOut(el, r[idx]));
      } else {
        setOut(outs[0], r);
        for (let i = 1; i < outs.length; i++) outs[i].value = "";
      }

      if (hint) hint.textContent = "";
    };

    let t=null;
    const recalcDebounced = () => {
      clearTimeout(t);
      t = setTimeout(recalc, 120);
    };

    form.addEventListener("submit", (e)=>{
      e.preventDefault();
      recalc();
    });

    ins.forEach(el => {
      el.addEventListener("input", recalcDebounced);
      el.addEventListener("change", recalcDebounced);
    });

    // Initialize
    recalc();
  }

  // What is P% of X?
  bindRow("calc-of", (p, x) => {
    if (!Number.isFinite(p) || !Number.isFinite(x)) return NaN;
    return x * (p/100);
  });

  // X is what percent of Y?
  bindRow("calc-whatpercent", (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y) || y === 0) return NaN;
    return (x / y) * 100;
  });

  // % change from A to B
  bindRow("calc-change", (a, b) => {
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0) return NaN;
    return ((b - a) / a) * 100;
  });

  // Apply a percentage increase/decrease to a base value
  // op: +1 (increase) or -1 (decrease)
  // Note: DOM order is op, base, percent
  bindRow("calc-adjust", (op, base, p) => {
    if (!Number.isFinite(base) || !Number.isFinite(p) || !Number.isFinite(op)) return NaN;
    return base * (1 + (op * (p/100)));
  });


  // Discount
  bindRow("calc-discount-final", (price, p) => {
    if (!Number.isFinite(price) || !Number.isFinite(p)) return NaN;
    return price * (1 - (p/100));
  });

  bindRow("calc-discount-save", (price, p) => {
    if (!Number.isFinite(price) || !Number.isFinite(p)) return NaN;
    return price * (p/100);
  });

  bindRow("calc-discount-original", (finalPrice, p) => {
    if (!Number.isFinite(finalPrice) || !Number.isFinite(p)) return NaN;
    const d = 1 - (p/100);
    if (d === 0) return NaN;
    return finalPrice / d;
  });

  // Sales tax / VAT
  bindRow("calc-tax-add", (amount, t) => {
    if (!Number.isFinite(amount) || !Number.isFinite(t)) return NaN;
    return amount * (1 + (t/100));
  });

  bindRow("calc-tax-remove", (total, t) => {
    if (!Number.isFinite(total) || !Number.isFinite(t)) return NaN;
    const m = 1 + (t/100);
    if (m === 0) return NaN;
    return total / m;
  });

  bindRow("calc-tax-only", (amount, t) => {
    if (!Number.isFinite(amount) || !Number.isFinite(t)) return NaN;
    return amount * (t/100);
  });

  // Tip
  bindRow("calc-tip-amount", (tipPct, bill) => {
    if (!Number.isFinite(bill) || !Number.isFinite(tipPct)) return NaN;
    return bill * (tipPct/100);
  });

  bindRow("calc-tip-total", (bill, tipPct) => {
    if (!Number.isFinite(bill) || !Number.isFinite(tipPct)) return NaN;
    return bill * (1 + (tipPct/100));
  });

  bindRow("calc-tip-split", (bill, tipPct, people) => {
    if (!Number.isFinite(bill) || !Number.isFinite(tipPct) || !Number.isFinite(people) || people <= 0) return NaN;
    return (bill * (1 + (tipPct/100))) / people;
  });

  // Loan payment (monthly payment, total paid, total interest)
  bindRow("calc-loan", (principal, apr, months) => {
    if (!Number.isFinite(principal) || !Number.isFinite(apr) || !Number.isFinite(months) || months <= 0) return NaN;

    const n = Math.round(months);
    if (n <= 0) return NaN;

    const i = (apr/100) / 12;
    let payment;
    if (i === 0) {
      payment = principal / n;
    } else {
      const pow = Math.pow(1 + i, n);
      const denom = (pow - 1);
      if (denom === 0) return NaN;
      payment = principal * (i * pow) / denom;
    }

    const totalPaid = payment * n;
    const totalInterest = totalPaid - principal;
    return [payment, totalPaid, totalInterest];
  });

  // Margin / Markup
  bindRow("calc-margin-from-costsell", (cost, sell) => {
    if (!Number.isFinite(cost) || !Number.isFinite(sell) || cost === 0 || sell === 0) return NaN;
    const profit = sell - cost;
    const margin = (profit / sell) * 100;
    const markup = (profit / cost) * 100;
    return [margin, markup];
  });

  bindRow("calc-margin-sell-from-markup", (cost, markupPct) => {
    if (!Number.isFinite(cost) || !Number.isFinite(markupPct)) return NaN;
    return cost * (1 + (markupPct/100));
  });

  bindRow("calc-margin-sell-from-margin", (cost, marginPct) => {
    if (!Number.isFinite(cost) || !Number.isFinite(marginPct)) return NaN;
    const d = 1 - (marginPct/100);
    if (d === 0) return NaN;
    return cost / d;
  });


  // footer year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();


  // Sticky header drawer + active page highlight
  function setupTopbar(){
    const hb = document.querySelector(".hamburger");
    const drawer = document.getElementById("drawer");
    const backdrop = document.querySelector("[data-drawer-backdrop]");
    const closeBtn = document.querySelector(".drawer-close");
    if (!hb || !drawer || !backdrop || !closeBtn) return;

    const openDrawer = () => {
      document.body.classList.add("drawer-open");
      hb.setAttribute("aria-expanded", "true");
      drawer.setAttribute("aria-hidden", "false");
    };

    const closeDrawer = () => {
      document.body.classList.remove("drawer-open");
      hb.setAttribute("aria-expanded", "false");
      drawer.setAttribute("aria-hidden", "true");
    };

    hb.addEventListener("click", () => {
      if (document.body.classList.contains("drawer-open")) closeDrawer();
      else openDrawer();
    });

    closeBtn.addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });

    // Mark active link
    const cur = (location.pathname.split("/").pop() || "index.html")
      .split("?")[0]
      .split("#")[0];

    const markActive = (selector) => {
      document.querySelectorAll(selector).forEach(a => {
        const href = (a.getAttribute("href") || "").split("?")[0].split("#")[0];
        if (href && href === cur) {
          a.classList.add("active");
          a.setAttribute("aria-current", "page");
        }
      });
    };

    markActive(".topbar-right a");
    markActive(".drawer-nav a");
  }



  // FAQ accordions (keep one open at a time per FAQ list)
  function setupFAQAccordions(){
    document.querySelectorAll('.faq-list').forEach((list) => {
      list.addEventListener('toggle', (e) => {
        const d = e.target;
        if (!d || d.tagName !== 'DETAILS') return;
        if (!d.open) return;
        list.querySelectorAll('details').forEach((other) => {
          if (other !== d) other.removeAttribute('open');
        });
      }, true);
    });
  }

  setupFAQAccordions();
  setupTopbar();

})();
