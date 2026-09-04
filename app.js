const API_BASE = window.EXPENSE_API_URL || "/api";
const STORAGE_KEY = "expense-tracker-expenses";
const AUTH_TOKEN_KEY = "expense-tracker-token";
const MIGRATION_KEY = "expense-tracker-local-migrated";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  return currencyFormatter.format(Number(value || 0));
}

function getStoredExpenses() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStoredExpenses(expenses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch {
    // ignore storage issues in restricted environments
  }
}

function categoryIcon(category) {
  const normalized = (category || "").toLowerCase();

  if (normalized.includes("food") || normalized.includes("eat") || normalized.includes("cafe")) return "🍽";
  if (normalized.includes("travel") || normalized.includes("fuel") || normalized.includes("ride")) return "✈";
  if (normalized.includes("rent") || normalized.includes("home") || normalized.includes("housing")) return "🏠";
  if (normalized.includes("shop") || normalized.includes("purchase") || normalized.includes("retail")) return "🛍";
  if (normalized.includes("health") || normalized.includes("care") || normalized.includes("doctor")) return "💊";
  if (normalized.includes("fun") || normalized.includes("entertain")) return "🎉";
  return "💳";
}

async function request(url, options = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body.detail) {
        detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // ignore parse errors
    }
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expense-form");
  const expenseList = document.getElementById("expense-list");
  const emptyState = document.getElementById("empty-state");
  const formError = document.getElementById("form-error");
  const submitBtn = document.getElementById("submit-btn");
  const cancelEdit = document.getElementById("cancel-edit");
  const idInput = document.getElementById("expense-id");
  const dateInput = document.getElementById("date");
  const liveBalance = document.getElementById("live-balance");
  const summary = document.getElementById("summary");
  const transactionCount = document.getElementById("transaction-count");
  const authPanel = document.getElementById("auth-panel");
  const authForm = document.getElementById("auth-form");
  const authPassword = document.getElementById("auth-password");
  const authError = document.getElementById("auth-error");
  const logoutBtn = document.getElementById("logout-btn");
  const dashboard = document.querySelector(".dashboard");

  function setAuthenticated(authenticated) {
    authPanel.hidden = authenticated;
    dashboard.hidden = !authenticated;
    logoutBtn.hidden = !authenticated;
  }

  function signOut() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setAuthenticated(false);
    authPassword.value = "";
  }

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    authError.hidden = true;
    try {
      const result = await request(`${API_BASE}/auth/login`, {
        method: "POST",
        body: JSON.stringify({ password: authPassword.value }),
      });
      localStorage.setItem(AUTH_TOKEN_KEY, result.token);
      setAuthenticated(true);
      await migrateLocalExpenses();
      await loadExpenses();
    } catch (error) {
      authError.hidden = false;
      authError.textContent = error.message;
    }
  });

  logoutBtn.addEventListener("click", signOut);

  async function migrateLocalExpenses() {
    if (localStorage.getItem(MIGRATION_KEY)) {
      return;
    }

    const localExpenses = getStoredExpenses();
    if (!localExpenses.length) {
      localStorage.setItem(MIGRATION_KEY, "true");
      return;
    }

    const remoteExpenses = await request(`${API_BASE}/expenses`);
    if (!remoteExpenses.length) {
      for (const expense of localExpenses) {
        await request(`${API_BASE}/expenses`, {
          method: "POST",
          body: JSON.stringify({
            date: expense.date,
            category: expense.category,
            amount: expense.amount,
            description: expense.description || null,
          }),
        });
      }
    }
    localStorage.setItem(MIGRATION_KEY, "true");
  }

  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  function showError(message) {
    formError.hidden = false;
    formError.textContent = message;
  }

  function clearError() {
    formError.hidden = true;
    formError.textContent = "";
  }

  function setEditing(expense) {
    idInput.value = expense.id;
    expenseForm.category.value = expense.category;
    expenseForm.amount.value = expense.amount;
    expenseForm.date.value = expense.date;
    expenseForm.description.value = expense.description || "";
    submitBtn.textContent = "Update Expense";
    cancelEdit.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearEditing() {
    idInput.value = "";
    expenseForm.reset();
    dateInput.value = new Date().toISOString().slice(0, 10);
    submitBtn.textContent = "Add Expense";
    cancelEdit.hidden = true;
  }

  function payloadFromForm() {
    return {
      category: expenseForm.category.value.trim(),
      amount: Number(expenseForm.amount.value),
      date: expenseForm.date.value,
      description: expenseForm.description.value.trim() || null,
    };
  }

  function renderSummary(expenses) {
    const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const average = expenses.length ? total / expenses.length : 0;

    const categoryTotals = expenses.reduce((accumulator, expense) => {
      const key = (expense.category || "Other").trim();
      accumulator[key] = (accumulator[key] || 0) + Number(expense.amount || 0);
      return accumulator;
    }, {});

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    const categoryLabel = topCategory ? topCategory[0] : "No data";
    const categoryValue = topCategory ? formatMoney(topCategory[1]) : "₹0.00";

    summary.innerHTML = `
      <div class="stat-card total">
        <span>Total spent</span>
        <strong>${formatMoney(total)}</strong>
        <small>${expenses.length} entries</small>
      </div>
      <div class="stat-card best">
        <span>Top category</span>
        <strong>${categoryLabel}</strong>
        <small>${categoryValue}</small>
      </div>
      <div class="stat-card avg">
        <span>Average</span>
        <strong>${formatMoney(average)}</strong>
        <small>per expense</small>
      </div>
      <div class="stat-card mood">
        <span>Status</span>
        <strong>${expenses.length ? "On track" : "Getting started"}</strong>
        <small>${expenses.length ? "Spending is being tracked" : "Add your first expense"}</small>
      </div>
    `;

    liveBalance.textContent = formatMoney(total);
  }

  function renderExpenses(expenses) {
    expenseList.innerHTML = "";
    transactionCount.textContent = `${expenses.length} ${expenses.length === 1 ? "entry" : "entries"}`;
    emptyState.classList.toggle("visible", expenses.length === 0);

    expenses.forEach((expense) => {
      const listItem = document.createElement("li");
      listItem.className = "expense-item";

      const expenseDate = expense.date || new Date().toISOString().slice(0, 10);
      const descriptionText = expense.description ? expense.description : "No note added";

      listItem.innerHTML = `
        <div class="expense-main">
          <div class="expense-icon">${categoryIcon(expense.category)}</div>
          <div class="expense-copy">
            <div class="expense-topline">
              <span class="expense-title">${expense.category}</span>
              <span class="expense-amount">-${formatMoney(expense.amount)}</span>
            </div>
            <div class="expense-meta">
              <span>${expenseDate}</span>
              <span class="dot">•</span>
              <span>${descriptionText}</span>
            </div>
          </div>
        </div>
        <div class="item-actions">
          <button type="button" class="item-btn edit">Edit</button>
          <button type="button" class="item-btn delete">Delete</button>
        </div>
      `;

      const editButton = listItem.querySelector(".edit");
      const deleteButton = listItem.querySelector(".delete");

      editButton.addEventListener("click", () => setEditing(expense));
      deleteButton.addEventListener("click", () => deleteExpense(expense.id));

      expenseList.appendChild(listItem);
    });
  }

  function readExpensesFromFallback() {
    const stored = getStoredExpenses();
    renderSummary(stored);
    renderExpenses(stored);
  }

  function saveExpenseLocally(expense) {
    const current = getStoredExpenses();
    const next = [expense, ...current];
    saveStoredExpenses(next);
    return next;
  }

  function updateExpenseLocally(expenseId, payload) {
    const current = getStoredExpenses();
    const next = current.map((item) => {
      if (String(item.id) === String(expenseId)) {
        return { ...item, ...payload };
      }
      return item;
    });
    saveStoredExpenses(next);
    return next;
  }

  function deleteExpenseLocally(expenseId) {
    const current = getStoredExpenses();
    const next = current.filter((item) => String(item.id) !== String(expenseId));
    saveStoredExpenses(next);
    return next;
  }

  async function loadExpenses() {
    try {
      const expenses = await request(`${API_BASE}/expenses`);
      saveStoredExpenses(expenses);
      renderSummary(expenses);
      renderExpenses(expenses);
      return;
    } catch (error) {
      if (error.status === 401) {
        signOut();
        return;
      }
      const localExpenses = getStoredExpenses();
      renderSummary(localExpenses);
      renderExpenses(localExpenses);
      // Ignore the backend warning in offline/demo mode so the interface stays clean.
    }
  }

  async function deleteExpense(id) {
    clearError();
    try {
      await request(`${API_BASE}/expenses/${id}`, { method: "DELETE" });
      if (idInput.value === String(id)) {
        clearEditing();
      }
      await loadExpenses();
      return;
    } catch (error) {
      const next = deleteExpenseLocally(id);
      if (idInput.value === String(id)) {
        clearEditing();
      }
      renderSummary(next);
      renderExpenses(next);
    }
  }

  expenseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    const data = payloadFromForm();
    const editingId = idInput.value;

    try {
      if (editingId) {
        await request(`${API_BASE}/expenses/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      } else {
        await request(`${API_BASE}/expenses`, {
          method: "POST",
          body: JSON.stringify(data),
        });
      }

      clearEditing();
      await loadExpenses();
      return;
    } catch (error) {
      const localData = {
        id: editingId || Date.now(),
        ...data,
      };

      if (editingId) {
        const next = updateExpenseLocally(editingId, data);
        renderSummary(next);
        renderExpenses(next);
      } else {
        const next = saveExpenseLocally(localData);
        renderSummary(next);
        renderExpenses(next);
      }

      clearEditing();
    }
  });

  cancelEdit.addEventListener("click", () => {
    clearError();
    clearEditing();
  });

  if (localStorage.getItem(AUTH_TOKEN_KEY)) {
    setAuthenticated(true);
    loadExpenses().catch((error) => showError(error.message));
  } else {
    setAuthenticated(false);
  }
});
