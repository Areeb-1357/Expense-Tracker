const API_BASE = "/api/expenses";

document.addEventListener("DOMContentLoaded", () => {
    const expenseForm = document.getElementById("expense-form");
    const expenseList = document.getElementById("expense-list");
    const emptyState = document.getElementById("empty-state");
    const totalAmount = document.getElementById("total-amount");
    const formError = document.getElementById("form-error");
    const submitBtn = document.getElementById("submit-btn");
    const cancelEdit = document.getElementById("cancel-edit");
    const idInput = document.getElementById("expense-id");
    const dateInput = document.getElementById("date");

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

    async function request(url, options = {}) {
        const response = await fetch(url, {
            headers: { "Content-Type": "application/json", ...(options.headers || {}) },
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
                /* ignore parse errors */
            }
            throw new Error(detail);
        }
        if (response.status === 204) {
            return null;
        }
        return response.json();
    }

    function renderExpenses(expenses) {
        expenseList.innerHTML = "";
        const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        totalAmount.textContent = `₹${total.toFixed(2)}`;
        emptyState.hidden = expenses.length > 0;

        expenses.forEach((expense) => {
            const listItem = document.createElement("li");
            listItem.className = "expense-item";

            const details = document.createElement("div");
            details.innerHTML = `<strong>${expense.category}</strong> · ₹${Number(expense.amount).toFixed(2)}
                <span class="meta">${expense.date}${expense.description ? ` — ${expense.description}` : ""}</span>`;

            const actions = document.createElement("div");
            actions.className = "item-actions";

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => setEditing(expense));

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "danger";
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener("click", () => deleteExpense(expense.id));

            actions.append(editBtn, deleteBtn);
            listItem.append(details, actions);
            expenseList.appendChild(listItem);
        });
    }

    async function loadExpenses() {
        const expenses = await request(API_BASE);
        renderExpenses(expenses);
    }

    async function deleteExpense(id) {
        clearError();
        try {
            await request(`${API_BASE}/${id}`, { method: "DELETE" });
            if (idInput.value === String(id)) {
                clearEditing();
            }
            await loadExpenses();
        } catch (error) {
            showError(error.message);
        }
    }

    expenseForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearError();
        const data = payloadFromForm();
        const editingId = idInput.value;

        try {
            if (editingId) {
                await request(`${API_BASE}/${editingId}`, {
                    method: "PUT",
                    body: JSON.stringify(data),
                });
            } else {
                await request(API_BASE, {
                    method: "POST",
                    body: JSON.stringify(data),
                });
            }
            clearEditing();
            await loadExpenses();
        } catch (error) {
            showError(error.message);
        }
    });

    cancelEdit.addEventListener("click", () => {
        clearError();
        clearEditing();
    });

    loadExpenses().catch((error) => showError(error.message));
});
