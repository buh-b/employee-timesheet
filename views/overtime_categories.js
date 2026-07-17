function renderOvertimeCategories(db, onDbChange) {
  const page = document.createElement("div");
  page.className = "page";

  function refresh() {
    page.innerHTML = "";
    render();
  }

  async function reloadCategories() {
    try {
      db.overtimeCategories = await apiRequest("/overtime_categories.php");
      onDbChange(db);
    } catch (err) {
      showToast(err.message || "Could not reload overtime categories.", "error");
    }
  }

  function render() {
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-primary";
    addBtn.innerHTML = `${icons.plus} Add Category`;
    addBtn.addEventListener("click", () => openCategoryModal(null));

    page.appendChild(pageHeader(
      "Overtime Categories",
      `${(db.overtimeCategories || []).length} categories`,
      addBtn
    ));

    const card = document.createElement("div");
    card.className = "card";

    const rows = (db.overtimeCategories || []).map(c => {
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-ghost btn-sm";
      editBtn.innerHTML = `${icons.pencil} Edit`;
      editBtn.addEventListener("click", () => openCategoryModal(c));

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-ghost btn-sm";
      delBtn.style.color = "var(--red, #ef4444)";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => deleteCategory(c));

      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.gap = "6px";
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      return [
        `<span class="font-medium text-sm">${c.category_name}</span>`,
        `<span class="mono text-xs" style="color:#6366f1;font-weight:600">${Number(c.rate_multiplier).toFixed(2)}×</span>`,
        actions,
      ];
    });

    card.appendChild(buildTable(
      ["Category Name", "Rate Multiplier", ""],
      rows,
      "No overtime categories defined."
    ));
    page.appendChild(card);
  }

  function deleteCategory(c) {
    const body = document.createElement("div");
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.gap = "18px";

    const message = document.createElement("p");
    message.className = "text-sm";
    message.textContent = `Are you sure you want to delete "${c.category_name}"? This will fail if it is assigned to any time logs.`;
    body.appendChild(message);

    const footer = document.createElement("div");
    footer.className = "modal-footer";

    const keepBtn = document.createElement("button");
    keepBtn.className = "btn btn-outline";
    keepBtn.textContent = "Keep Category";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger";
    deleteBtn.textContent = "Delete Category";

    footer.appendChild(keepBtn);
    footer.appendChild(deleteBtn);
    body.appendChild(footer);

    const { close } = openModal({ title: "Delete Overtime Category", body });

    keepBtn.addEventListener("click", close);

    deleteBtn.addEventListener("click", async () => {
      deleteBtn.disabled = true;
      try {
        await apiRequest(`/overtime_categories.php?id=${c.overtime_category_id}`, { method: "DELETE" });
        await reloadCategories();
        close();
        showToast("Overtime category deleted.", "success");
        refresh();
      } catch (err) {
        showToast(err.message || "Could not delete category.", "error");
        deleteBtn.disabled = false;
      }
    });
  }

  function openCategoryModal(existing) {
    const isEdit = !!existing;
    const data = isEdit ? { ...existing } : { category_name: "", rate_multiplier: 1.25 };

    const body = document.createElement("div");
    body.style.cssText = "display:flex;flex-direction:column;gap:14px";

    const fName = makeInput("text", data.category_name, "e.g. Regular OT");
    const fMult = makeInput("number", data.rate_multiplier);
    fMult.step = "0.01";
    fMult.min  = "0.01";

    const hint = document.createElement("div");
    hint.style.cssText = "font-size:0.78rem;color:var(--text-muted)";
    hint.textContent = "Philippine standard rates: Regular OT = 1.25×, Rest Day OT = 1.30×, Holiday OT = 2.60×";

    body.appendChild(buildField("Category Name", fName));
    body.appendChild(buildField("Rate Multiplier", fMult));
    body.appendChild(hint);

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
    saveBtn.innerHTML = `${icons.check} ${isEdit ? "Save Changes" : "Add Category"}`;
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);
    body.appendChild(footer);

    const { close } = openModal({
      title: isEdit ? "Edit Overtime Category" : "Add Overtime Category",
      body,
    });

    cancelBtn.addEventListener("click", close);

    saveBtn.addEventListener("click", async () => {
      const name = fName.value.trim();
      const mult = parseFloat(fMult.value);

      if (!name) {
        errEl.textContent = "Category name is required.";
        errEl.style.display = "block";
        return;
      }
      if (!mult || mult <= 0) {
        errEl.textContent = "Rate multiplier must be greater than 0.";
        errEl.style.display = "block";
        return;
      }

      const payload = { category_name: name, rate_multiplier: mult };
      if (isEdit) payload.overtime_category_id = data.overtime_category_id;

      errEl.style.display = "none";
      saveBtn.disabled = true;

      try {
        await apiRequest("/overtime_categories.php", {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify(payload),
        });
        await reloadCategories();
        close();
        showToast(isEdit ? "Category updated." : "Category added.", "success");
        refresh();
      } catch (err) {
        errEl.textContent = err.message || "Could not save category.";
        errEl.style.display = "block";
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  render();
  return page;
}