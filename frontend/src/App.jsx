


import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api/transactions";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [type, setType] = useState("Expense");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");

  const fetchTransactions = async () => {
    try {
      setError("");
      const response = await axios.get(API_URL);
      setTransactions(response.data);
    } catch (err) {
      console.log(err);
      setError("Unable to load transactions. Check your backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const income = transactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = transactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = income - expenses;

  const formatMoney = (value) =>
    "₹" + Number(value).toLocaleString("en-IN");

  // Expense category calculations
  const categorySummary = transactions
    .filter((t) => t.type === "Expense")
    .reduce((result, t) => {
      const cat = t.category || "Other";
      result[cat] = (result[cat] || 0) + Number(t.amount);
      return result;
    }, {});

  const categoryEntries = Object.entries(categorySummary).sort(
    (a, b) => b[1] - a[1]
  );

  const chartColors = [
    "#f59e0b",
    "#ef6464",
    "#20a4dc",
    "#7766ee",
    "#94a3b8",
    "#20a078",
    "#e879b0",
  ];

  let currentAngle = 0;
  const donutGradient = categoryEntries.length
    ? `conic-gradient(${categoryEntries.map(([cat, value], index) => {
        const start = currentAngle;
        const percentage = expenses > 0 ? (value / expenses) * 100 : 0;
        currentAngle += percentage;
        return `${chartColors[index % chartColors.length]} ${start}% ${currentAngle}%`;
      }).join(", ")})`
    : "#e5e7eb";

  // Last six months of actual transaction data
  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));

    const month = date.getMonth();
    const year = date.getFullYear();

    const monthTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === month &&
        transactionDate.getFullYear() === year
      );
    });

    return {
      label: date.toLocaleDateString("en-IN", { month: "short" }),
      income: monthTransactions
        .filter((t) => t.type === "Income")
        .reduce((sum, t) => sum + Number(t.amount), 0),
      expense: monthTransactions
        .filter((t) => t.type === "Expense")
        .reduce((sum, t) => sum + Number(t.amount), 0),
    };
  });

  const maxMonthly = Math.max(
    1,
    ...monthlyData.flatMap((m) => [m.income, m.expense])
  );

  const makePoints = (key) =>
    monthlyData.map((item, index) => {
      const x = 35 + index * 105;
      const y = 165 - (item[key] / maxMonthly) * 140;
      return `${x},${y}`;
    }).join(" ");

  const clearForm = () => {
    setTitle("");
    setAmount("");
    setCategory("Food");
    setType("Expense");
    setEditingId(null);
  };

  const addTransaction = async (e) => {
    e.preventDefault();

    if (!title.trim() || !amount || Number(amount) <= 0) {
      alert("Please enter valid transaction details");
      return;
    }

    try {
      const transactionData = {
        title: title.trim(),
        amount: Number(amount),
        category,
        type,
      };

      if (editingId !== null) {
        const response = await axios.put(
          `${API_URL}/${editingId}`,
          transactionData
        );

        setTransactions((prev) =>
          prev.map((t) =>
            t._id === editingId
              ? response.data.updatedTransaction
              : t
          )
        );

        alert("Transaction updated successfully!");
      } else {
        const response = await axios.post(API_URL, transactionData);
        setTransactions((prev) => [response.data, ...prev]);
        alert("Transaction added successfully!");
      }

      clearForm();
    } catch (err) {
      console.log(err);
      alert("Unable to save transaction.");
    }
  };

  const editTransaction = (item) => {
    setEditingId(item._id);
    setTitle(item.title);
    setAmount(item.amount);
    setCategory(item.category);
    setType(item.type);
    setActivePage("Transactions");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteTransaction = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTransactions((prev) => prev.filter((t) => t._id !== id));

      if (editingId === id) clearForm();

      alert("Transaction deleted successfully!");
    } catch (err) {
      console.log(err);
      alert("Unable to delete transaction.");
    }
  };

  const menuItems = [
    { name: "Dashboard", icon: "▦" },
    { name: "Transactions", icon: "▤" },
    { name: "Categories", icon: "◇" },
    { name: "Reports", icon: "▥" },
  ];

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">₹</span>
          <span>Expenso</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => {
                setActivePage(item.name);
                if (item.name === "Transactions") clearForm();
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span>💡</span>
            <p>Track your money and manage your expenses smartly.</p>
          </div>
          <div className="sidebar-footer">Smart Expense Tracker</div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Workspace / {activePage}</p>
            <h1>{activePage === "Dashboard" ? "Dashboard Overview" : activePage}</h1>
          </div>
          <div className="topbar-right">
            <span className="today-label">
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <div className="profile">👤</div>
          </div>
        </header>

        <div className="dashboard-content">
          {activePage === "Dashboard" && (
            <>
              <section className="summary">
                <div className="summary-card expense-card">
                  <div className="summary-icon red">▣</div>
                  <div>
                    <p>Total Expenses</p>
                    <h2>{formatMoney(expenses)}</h2>
                  </div>
                </div>

                <div className="summary-card income-card">
                  <div className="summary-icon green">▣</div>
                  <div>
                    <p>Total Income</p>
                    <h2>{formatMoney(income)}</h2>
                  </div>
                </div>

                <div className="summary-card balance-card">
                  <div className="summary-icon blue">▣</div>
                  <div>
                    <p>Remaining Balance</p>
                    <h2>{formatMoney(balance)}</h2>
                  </div>
                </div>
              </section>

              <section className="analytics-grid">
                <div className="panel category-panel">
                  <div className="panel-heading">
                    <h2>Category Breakdown</h2>
                    <span>Expenses</span>
                  </div>

                  {categoryEntries.length === 0 ? (
                    <p className="empty">No expense data available.</p>
                  ) : (
                    <>
                      <div
                        className="donut-chart"
                        style={{ background: donutGradient }}
                      >
                        <div className="donut-center">
                          <span>Total Expenses</span>
                          <strong>{formatMoney(expenses)}</strong>
                        </div>
                      </div>

                      <div className="category-legend">
                        {categoryEntries.map(([cat, value], index) => (
                          <div className="legend-item" key={cat}>
                            <span
                              className="legend-dot"
                              style={{
                                background:
                                  chartColors[index % chartColors.length],
                              }}
                            />
                            <span>{cat}</span>
                            <strong>{formatMoney(value)}</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="panel trends-panel">
                  <div className="panel-heading">
                    <h2>Expense Trends</h2>
                    <span>Last 6 months</span>
                  </div>

                  <div className="chart-legend">
                    <span><i className="income-dot" /> Income</span>
                    <span><i className="expense-dot" /> Expenses</span>
                  </div>

                  <div className="line-chart">
                    <svg viewBox="0 0 560 200" preserveAspectRatio="none">
                      {[25, 60, 95, 130, 165].map((y) => (
                        <line
                          key={y}
                          x1="25"
                          y1={y}
                          x2="550"
                          y2={y}
                          stroke="#e9edf2"
                          strokeDasharray="4 4"
                        />
                      ))}

                      <polyline
                        points={makePoints("income")}
                        fill="none"
                        stroke="#269ed7"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <polyline
                        points={makePoints("expense")}
                        fill="none"
                        stroke="#f39b32"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {monthlyData.map((m, index) => {
                        const x = 35 + index * 105;
                        const incomeY = 165 - (m.income / maxMonthly) * 140;
                        const expenseY = 165 - (m.expense / maxMonthly) * 140;

                        return (
                          <g key={m.label}>
                            <circle cx={x} cy={incomeY} r="4" fill="#269ed7" />
                            <circle cx={x} cy={expenseY} r="4" fill="#f39b32" />
                            <text
                              x={x}
                              y="190"
                              textAnchor="middle"
                              fill="#858d99"
                              fontSize="11"
                            >
                              {m.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <p className="chart-note">
                    Based on your saved transaction dates and amounts.
                  </p>
                </div>
              </section>

              <section className="panel recent-panel">
                <div className="panel-heading">
                  <h2>Recent Transactions</h2>
                  <button
                    className="view-all"
                    onClick={() => setActivePage("Transactions")}
                  >
                    View all →
                  </button>
                </div>

                {loading ? (
                  <p className="empty">Loading transactions...</p>
                ) : error ? (
                  <p className="empty">{error}</p>
                ) : recentTransactions.length === 0 ? (
                  <p className="empty">No transactions added yet.</p>
                ) : (
                  <div className="table-scroll">
                    <table className="transaction-table">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Category</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Type</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTransactions.slice(0, 8).map((item) => (
                          <tr key={item._id}>
                            <td className="description-cell">{item.title}</td>
                            <td>{item.category}</td>
                            <td>
                              {new Date(item.date).toLocaleDateString("en-IN")}
                            </td>
                            <td className={
                              item.type === "Income" ? "amount-income" : "amount-expense"
                            }>
                              {item.type === "Income" ? "+" : "-"}
                              {formatMoney(item.amount)}
                            </td>
                            <td>
                              <span className={`status ${item.type.toLowerCase()}`}>
                                {item.type}
                              </span>
                            </td>
                            <td>
                              <button className="table-edit" onClick={() => editTransaction(item)}>
                                Edit
                              </button>
                              <button className="table-delete" onClick={() => deleteTransaction(item._id)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {activePage === "Transactions" && (
            <section className="transactions-page">
              <div className="panel form-panel">
                <h2>{editingId !== null ? "Edit Transaction" : "Add Transaction"}</h2>
                <form onSubmit={addTransaction}>
                  <label>Transaction Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter title"
                    required
                  />

                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                  />

                  <label>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option>Food</option>
                    <option>Travel</option>
                    <option>Shopping</option>
                    <option>Education</option>
                    <option>Bills</option>
                    <option>Income</option>
                    <option>Other</option>
                  </select>

                  <label>Transaction Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                  </select>

                  <button className="primary-btn" type="submit">
                    {editingId !== null ? "Update Transaction" : "+ Add Transaction"}
                  </button>

                  {editingId !== null && (
                    <button type="button" className="cancel-btn" onClick={clearForm}>
                      Cancel
                    </button>
                  )}
                </form>
              </div>

              <div className="panel full-transactions">
                <h2>All Transactions</h2>
                {loading ? (
                  <p className="empty">Loading transactions...</p>
                ) : (
                  <div className="table-scroll">
                    <table className="transaction-table">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Category</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Type</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTransactions.map((item) => (
                          <tr key={item._id}>
                            <td className="description-cell">{item.title}</td>
                            <td>{item.category}</td>
                            <td>{new Date(item.date).toLocaleDateString("en-IN")}</td>
                            <td className={item.type === "Income" ? "amount-income" : "amount-expense"}>
                              {item.type === "Income" ? "+" : "-"}{formatMoney(item.amount)}
                            </td>
                            <td><span className={`status ${item.type.toLowerCase()}`}>{item.type}</span></td>
                            <td>
                              <button className="table-edit" onClick={() => editTransaction(item)}>Edit</button>
                              <button className="table-delete" onClick={() => deleteTransaction(item._id)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {activePage === "Categories" && (
            <section className="panel categories-page">
              <h2>Expense Categories</h2>
              <p className="page-description">See how your expenses are divided by category.</p>
              {categoryEntries.length === 0 ? (
                <p className="empty">No expense categories available.</p>
              ) : (
                <div className="category-page-list">
                  {categoryEntries.map(([cat, value], index) => (
                    <div className="category-page-item" key={cat}>
                      <span className="legend-dot" style={{ background: chartColors[index % chartColors.length] }} />
                      <strong>{cat}</strong>
                      <span>{formatMoney(value)}</span>
                      <span>{expenses > 0 ? ((value / expenses) * 100).toFixed(1) : 0}%</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activePage === "Reports" && (
            <section className="panel reports-page">
              <h2>Financial Report</h2>
              <p className="page-description">Summary of your saved transactions.</p>
              <div className="report-row"><span>Total Income</span><strong className="amount-income">{formatMoney(income)}</strong></div>
              <div className="report-row"><span>Total Expenses</span><strong className="amount-expense">{formatMoney(expenses)}</strong></div>
              <div className="report-row"><span>Remaining Balance</span><strong>{formatMoney(balance)}</strong></div>
              <div className="report-row"><span>Total Transactions</span><strong>{transactions.length}</strong></div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
