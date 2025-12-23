let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = null;

let expenses = [];
let monthlyBudget = 0;
let selectedDate = null;
let editId = null;
let viewDate = new Date();

/* ---------- AUTH ---------- */
function login() {
    const u = username.value.trim();
    const p = password.value.trim();
    if (!u || !p) return;

    let firstLogin = false;

    if (!users[u]) {
        users[u] = { password: p, expenses: [], budget: 0, seenHelp: false };
        firstLogin = true;
    } else if (users[u].password !== p) {
        authMsg.textContent = "Wrong password";
        return;
    }

    localStorage.setItem("users", JSON.stringify(users));
    currentUser = u;
    loadUser(firstLogin);
}

function logout() {
    currentUser = null;
    authBox.style.display = "block";
    app.style.display = "none";
}

/* ---------- LOAD USER ---------- */
function loadUser(firstLogin) {
    const u = users[currentUser];
    expenses = u.expenses;
    monthlyBudget = u.budget;

    authBox.style.display = "none";
    app.style.display = "block";

    monthlyBudgetInput.value = monthlyBudget;
    render();

    if (firstLogin || !u.seenHelp) {
        showHelp();
        u.seenHelp = true;
        saveUser();
    }
}

function saveUser() {
    users[currentUser].expenses = expenses;
    users[currentUser].budget = monthlyBudget;
    localStorage.setItem("users", JSON.stringify(users));
}

/* ---------- HELP POPUP ---------- */
function showHelp() {
    document.getElementById("helpPopup").style.display = "flex";
}

function closeHelp() {
    document.getElementById("helpPopup").style.display = "none";
}

/* ---------- BUDGET ---------- */
function setBudget() {
    monthlyBudget = Number(monthlyBudgetInput.value);
    saveUser();
    render();
}

function resetAll() {
    if (!confirm("Reset all data?")) return;
    expenses = [];
    monthlyBudget = 0;
    saveUser();
    render();
}

/* ---------- EXPENSE ---------- */
function addExpense() {
    if (!title.value || !amount.value || !date.value) return;

    const today = new Date().toISOString().split("T")[0];
    if (date.value > today) {
        alert("Future expenses not allowed");
        return;
    }

    if (editId) {
        const e = expenses.find(x => x.id === editId);
        e.title = title.value;
        e.amount = Number(amount.value);
        e.date = date.value;
        editId = null;
    } else {
        expenses.push({
            id: Date.now(),
            title: title.value,
            amount: Number(amount.value),
            date: date.value
        });
    }

    title.value = amount.value = date.value = "";
    saveUser();
    render();
}

function editExpense(id) {
    const e = expenses.find(x => x.id === id);
    title.value = e.title;
    amount.value = e.amount;
    date.value = e.date;
    editId = id;
}

function deleteExpense(id) {
    expenses = expenses.filter(e => e.id !== id);
    saveUser();
    render();
}

/* ---------- HELPERS ---------- */
function daysInMonth(y, m) {
    return new Date(y, m + 1, 0).getDate();
}

/* ---------- MONTH NAV ---------- */
function prevMonth() {
    viewDate.setMonth(viewDate.getMonth() - 1);
    render();
}

function nextMonth() {
    viewDate.setMonth(viewDate.getMonth() + 1);
    render();
}

/* ---------- CALENDAR ---------- */
function renderCalendar() {
    calendar.innerHTML = "";

    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const days = daysInMonth(y, m);
    const today = new Date();
    const dailyBudget = monthlyBudget ? monthlyBudget / days : 0;

    monthLabel.textContent = viewDate.toLocaleString("default", {
        month: "long",
        year: "numeric"
    });

    dailyBudgetText.textContent = dailyBudget.toFixed(2);

    for (let d = 1; d <= days; d++) {
        const dateStr = `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const dateObj = new Date(dateStr);

        const total = expenses
            .filter(e => e.date === dateStr)
            .reduce((s,e)=>s+e.amount,0);

        let cls = "day ";

        if (dateObj > today) cls += "grey";
        else if (!monthlyBudget || total === 0) cls += "white";
        else if (total === dailyBudget) cls += "green";
        else if (total < dailyBudget) cls += "blue";
        else cls += "red";

        if (selectedDate === dateStr) cls += " selected";

        const div = document.createElement("div");
        div.className = cls;
        div.textContent = d;

        div.onclick = () => {
            if (dateObj > today) return;
            selectedDate = dateStr;
            render();
        };

        calendar.appendChild(div);
    }
}

/* ---------- LISTS ---------- */
function renderDayList() {
    dayList.innerHTML = "";

    if (!selectedDate) {
        selectedDayTitle.textContent = "Select a day";
        return;
    }

    selectedDayTitle.textContent = `Expenses on ${selectedDate}`;

    expenses
        .filter(e => e.date === selectedDate)
        .forEach(e => {
            dayList.innerHTML += `
            <li>
                ${e.title} - ₹${e.amount}
                <button onclick="editExpense(${e.id})">✏️</button>
                <button onclick="deleteExpense(${e.id})">❌</button>
            </li>`;
        });
}

function renderMonthlyList() {
    monthlyList.innerHTML = "";
    expenses.forEach(e => {
        monthlyList.innerHTML += `<li>${e.date} - ${e.title} - ₹${e.amount}</li>`;
    });
}

/* ---------- MAIN ---------- */
function render() {
    renderCalendar();
    renderDayList();
    renderMonthlyList();
    budgetInfo.textContent = `Monthly Budget: ₹${monthlyBudget}`;
}

/* ---------- INIT ---------- */
const monthlyBudgetInput = document.getElementById("monthlyBudget");
