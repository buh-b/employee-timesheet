// ── Data layer ───────────────────────────────────────
// Assumes project lives at htdocs/timesheet/
const API_BASE_URL = "https://labortrack-api.dcism.org/backend";

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });

  let body = null;
  try { body = await res.json(); } catch {}

  if (!res.ok || !body || body.success === false) {
    const message = (body && body.error) || `Request failed: ${res.status}`;
    throw new Error(message);
  }

  return body.data;
}

// ── Auth ──────────────────────────────────────────────
async function loginRequest(username, password) {
  return apiRequest("/auth.php?action=login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

async function logoutRequest() {
  return apiRequest("/auth.php?action=logout", { method: "POST" });
}

// ── Bulk fetch ────────────────────────────────────────
async function fetchAllData() {
  const safe = (p) => p.catch(() => []);

  const [employees, departments, roles, shiftCategories, attendanceStatuses, leaveRecords, accounts, timeLogs] =
    await Promise.all([
      apiRequest("/employees.php"),
      apiRequest("/departments.php"),
      apiRequest("/roles.php"),
      apiRequest("/shift_categories.php"),
      safe(apiRequest("/attendance_status.php")),
      safe(apiRequest("/leave_records.php")),
      safe(apiRequest("/accounts.php")), // admin only
      safe(apiRequest("/time_logs.php")),
    ]);

  return {
    employees,
    departments,
    roles,
    shiftCategories,
    attendanceStatuses,
    timeLogs,
    leaveRecords,
    accounts,
  };
}

// ── Employees ─────────────────────────────────────────
async function createEmployeeRequest(employee) {
  return apiRequest("/employees.php", { method: "POST", body: JSON.stringify(employee) });
}
async function updateEmployeeRequest(employeeId, employee) {
  return apiRequest("/employees.php", {
    method: "PUT",
    body: JSON.stringify({ ...employee, employee_id: employeeId }),
  });
}

// ── Accounts ──────────────────────────────────────────
async function createAccountRequest(account) {
  return apiRequest("/accounts.php", { method: "POST", body: JSON.stringify(account) });
}
async function updateAccountRequest(accountId, account) {
  return apiRequest("/accounts.php", {
    method: "PUT",
    body: JSON.stringify({ ...account, account_id: accountId }),
  });
}
async function deleteAccountRequest(accountId) {
  return apiRequest(`/accounts.php?id=${accountId}`, { method: "DELETE" });
}

// ── Time Logs ─────────────────────────────────────────
async function clockInRequest(shiftCategoryId) {
  return apiRequest("/time_logs.php?action=clock_in", {
    method: "POST",
    body: JSON.stringify({ shift_category_id: shiftCategoryId }),
  });
}
async function clockOutRequest() {
  return apiRequest("/time_logs.php?action=clock_out", { method: "POST" });
}
async function updateTimeLogRequest(logId, data) {
  return apiRequest("/time_logs.php", {
    method: "PUT",
    body: JSON.stringify({ ...data, log_id: logId }),
  });
}

// ── Empty shape ───────────────────────────────────────
function emptyDb() {
  return {
    departments: [], roles: [], employees: [],
    shiftCategories: [], attendanceStatuses: [],
    timeLogs: [], leaveRecords: [], accounts: [],
  };
}
