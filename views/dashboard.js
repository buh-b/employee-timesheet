// ── Dashboard view ────────────────────────────────────
// account param is passed so employee dashboard can be personalised

function renderDashboard(db, account) {
  const page = document.createElement("div");
  page.className = "page";

  const isAdmin = account && account.access_level === "admin";

  if (isAdmin) {
    // ── Admin dashboard ──────────────────────────────
    const activeEmp  = db.employees.filter(e => e.employment_status === "Active").length;
    const pending    = db.leaveRecords.filter(l => l.leave_status === "Pending").length;
    const weekStart  = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekHours  = db.timeLogs
      .filter(l => new Date(l.clock_in) >= weekStart && l.total_hours != null)
      .reduce((s, l) => s + (l.total_hours || 0), 0);

    page.appendChild(pageHeader("Dashboard", "Overview of workforce attendance and activity"));

    const statGrid = document.createElement("div");
    statGrid.className = "stat-grid";
    statGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Active Employees</div>
        <div class="stat-value indigo">${activeEmp}</div>
        <div class="stat-sub">across all departments</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Clocked In Today</div>
        <div class="stat-value emerald">${db.timeLogs.filter(l => isToday(l.clock_in)).length}</div>
        <div class="stat-sub">time logs today</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pending Leaves</div>
        <div class="stat-value amber">${pending}</div>
        <div class="stat-sub">awaiting approval</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Hours This Week</div>
        <div class="stat-value sky">${weekHours.toFixed(1)}</div>
        <div class="stat-sub">all employees combined</div>
      </div>
    `;
    page.appendChild(statGrid);

    // Pending leave requests
    const grid = document.createElement("div");
    grid.className = "grid-3";

    const pendingCard = document.createElement("div");
    pendingCard.className = "card";
    pendingCard.innerHTML = `<div class="card-header">Pending Leave Requests</div>`;

    const pendingLeaves = db.leaveRecords.filter(l => l.leave_status === "Pending").slice(0, 5);
    if (!pendingLeaves.length) {
      pendingCard.innerHTML += `<div class="table-empty">No pending requests</div>`;
    } else {
      pendingLeaves.forEach(l => {
        const item = document.createElement("div");
        item.className = "pending-item";
        item.innerHTML = `
          <div class="pending-item-top">
            ${avatarHTML(l.full_name || "?", "sm")}
            <span class="pending-item-name">${l.full_name || "Unknown"}</span>
          </div>
          <div class="pending-type">${l.leave_type}</div>
          <div class="pending-dates">${fmtDate(l.date_from)} → ${fmtDate(l.date_to)}</div>
        `;
        pendingCard.appendChild(item);
      });
    }

    grid.appendChild(pendingCard);
    page.appendChild(grid);

  } else {
    // ── Employee dashboard ───────────────────────────
    const emp = account && account.employee_id != null
      ? db.employees.find(e => e.employee_id === account.employee_id)
      : null;

    const displayName = emp ? emp.full_name : (account ? account.username : "Employee");

    page.appendChild(pageHeader(`Welcome, ${displayName}`, "Your personal overview"));

    const myLeaves = db.leaveRecords.filter(l => l.employee_id === (account && account.employee_id));
    const pending  = myLeaves.filter(l => l.leave_status === "Pending").length;
    const approved = myLeaves.filter(l => l.leave_status === "Approved").length;

    const statGrid = document.createElement("div");
    statGrid.className = "stat-grid";
    statGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">My Pending Leaves</div>
        <div class="stat-value amber">${pending}</div>
        <div class="stat-sub">awaiting approval</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">My Approved Leaves</div>
        <div class="stat-value emerald">${approved}</div>
        <div class="stat-sub">this year</div>
      </div>
      ${emp ? `
      <div class="stat-card">
        <div class="stat-label">Hourly Rate</div>
        <div class="stat-value indigo">₱${Number(emp.current_hourly_rate).toFixed(2)}</div>
        <div class="stat-sub">current rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Status</div>
        <div class="stat-value sky">${emp.employment_status}</div>
        <div class="stat-sub">${emp.department_name || "No department"}</div>
      </div>` : ""}
    `;
    page.appendChild(statGrid);
  }

  return page;
}
