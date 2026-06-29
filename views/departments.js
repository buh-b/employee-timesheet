// ── Departments view (admin only) ─────────────────────
// TSK-33: Table showing each department's name, code,
//         employee headcount, and total labor cost allocation.
//         Admin can also add and edit departments.

function renderDepartments(db, onDbChange) {
  const page = document.createElement("div");
  page.className = "page";

  let searchVal = "";

  function refresh() {
    page.innerHTML = "";
    render();
  }

  async function reloadDepartments() {
    try {
      db.departments = await apiRequest("/departments.php");
      onDbChange(db);
    } catch (err) {
      showToast(err.message || "Could not reload departments.", "error");
    }
  }

  function render() {
    // ── Header ───────────────────────────────────────
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-primary";
    addBtn.innerHTML = `${icons.plus} Add Department`;
    addBtn.addEventListener("click", () => openDepartmentModal(null));

    page.appendChild(pageHeader(
      "Departments",
      `${db.departments.length} departments`,
      addBtn
    ));

    // ── Card ──────────────────────────────────────────
    const card = document.createElement("div");
    card.className = "card";

    // Search bar
    const searchBar = document.createElement("div");
    searchBar.className = "search-bar";
    searchBar.innerHTML = `${icons.search}`;
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search by department name or code…";
    searchInput.value = searchVal;
    searchInput.addEventListener("input", e => {
      searchVal = e.target.value;
      renderTable(card);
    });
    searchBar.appendChild(searchInput);
    card.appendChild(searchBar);

    renderTable(card);
    page.appendChild(card);
  }

  function renderTable(card) {
    const old = card.querySelector(".table-wrap, .table-empty-wrap");
    if (old) old.remove();

    const filtered = db.departments.filter(d =>
      d.department_name.toLowerCase().includes(searchVal.toLowerCase()) ||
      (d.department_code || "").toLowerCase().includes(searchVal.toLowerCase())
    );

    // Summary strip — total headcount and total budget
    const totalEmployees = filtered.reduce((s, d) => s + (d.employee_count || 0), 0);
    const totalBudget    = filtered.reduce((s, d) => s + (d.labor_cost_allocation || 0), 0);

    const oldStrip = card.querySelector(".dept-summary-strip");
    if (oldStrip) oldStrip.remove();

    const strip = document.createElement("div");
    strip.className = "dept-summary-strip";
    strip.style.cssText = "display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap";
    strip.innerHTML = `
      <div style="background:#f8faff;border:1px solid #e0e7ff;border-radius:10px;padding:10px 18px;display:flex;align-items:center;gap:10px">
        <span style="font-size:1.2rem;font-weight:800;color:#6366f1">${totalEmployees}</span>
        <span style="font-size:0.75rem;color:var(--text-muted);font-weight:500">Total Employees</span>
      </div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 18px;display:flex;align-items:center;gap:10px">
        <span style="font-size:1.2rem;font-weight:800;color:#16a34a">₱${totalBudget.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
        <span style="font-size:0.75rem;color:var(--text-muted);font-weight:500">Total Labor Cost Budget</span>
      </div>
    `;
    card.insertBefore(strip, card.querySelector(".table-wrap") || null);

    const rows = filtered.map(d => {
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-ghost btn-sm";
      editBtn.innerHTML = `${icons.pencil} Edit`;
      editBtn.addEventListener("click", () => openDepartmentModal(d));

      return [
        `<span class="font-medium text-sm">${d.department_name}</span>`,
        `<span class="mono text-xs">${d.department_code || "—"}</span>`,
        `<span class="text-sm">${d.employee_count || 0}</span>`,
        `<span class="mono text-xs">₱${Number(d.labor_cost_allocation || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>`,
        editBtn,
      ];
    });

    const table = buildTable(
      ["Department", "Code", "Headcount", "Labor Cost Allocation", ""],
      rows,
      "No departments found."
    );
    card.appendChild(table);
  }

  // ── Add / Edit modal ──────────────────────────────
  function openDepartmentModal(existing) {
    const isEdit = !!existing;
    const data = isEdit ? { ...existing } : {
      department_name: "",
      department_code: "",
      labor_cost_allocation: 0,
    };

    const body = document.createElement("div");
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.gap = "14px";

    const fName   = makeInput("text",   data.department_name,       "e.g. Human Resources");
    const fCode   = makeInput("text",   data.department_code,       "e.g. HR");
    const fBudget = makeInput("number", data.labor_cost_allocation);

    body.appendChild(buildField("Department Name", fName));
    body.appendChild(buildField("Department Code", fCode));
    body.appendChild(buildField("Labor Cost Allocation (₱)", fBudget));

    const errEl = document.createElement("div");
    errEl.className = "alert-error";
    errEl.style.display = "none";
    body.appendChild(errEl);

    const footer = document.createElement("div");
    footer.className = "modal-footer";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-outline";
    cancelBtn.textContent = "Cancel";

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-primary";
    saveBtn.innerHTML = `${icons.check} ${isEdit ? "Save Changes" : "Add Department"}`;

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);
    body.appendChild(footer);

    const { close } = openModal({
      title: isEdit ? "Edit Department" : "Add Department",
      body,
    });

    cancelBtn.addEventListener("click", close);

    saveBtn.addEventListener("click", async () => {
      const name   = fName.value.trim();
      const code   = fCode.value.trim();
      const budget = Number(fBudget.value) || 0;

      if (!name) { errEl.textContent = "Department name is required."; errEl.style.display = "block"; return; }
      if (!code) { errEl.textContent = "Department code is required."; errEl.style.display = "block"; return; }

      const payload = {
        department_name:       name,
        department_code:       code.toUpperCase(),
        labor_cost_allocation: budget,
      };

      if (isEdit) payload.department_id = data.department_id;

      errEl.style.display = "none";
      saveBtn.disabled = true;

      try {
        await apiRequest("/departments.php", {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify(payload),
        });
        await reloadDepartments();
        close();
        showToast(isEdit ? "Department updated." : "Department added.", "success");
        refresh();
      } catch (err) {
        errEl.textContent = err.message || "Could not save department.";
        errEl.style.display = "block";
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  render();
  return page;
}