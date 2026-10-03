"use client";

import { useEffect, useState } from "react";

async function readApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return { error: `Server returned an unexpected response (${response.status}). Check Vercel function logs and database settings.` };
  }
  try {
    return await response.json();
  } catch {
    return { error: "The server returned an invalid response. Check Vercel function logs." };
  }
}

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [taskText, setTaskText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadTasks() {
    const response = await fetch("/api/tasks");
    if (!response.ok) return false;
    const data = await response.json();
    setTasks(data.tasks);
    return true;
  }

  useEffect(() => {
    let active = true;
    fetch("/api/tasks")
      .then(async (response) => {
        const data = await readApiResponse(response);
        if (!response.ok) {
          if (response.status >= 500 && active) setError(data.error || "The server is temporarily unavailable.");
          return;
        }
        if (active) {
          setTasks(data.tasks);
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const endpoint = view === "login" ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      if (view === "register") {
        setView("login");
        setPassword("");
        setError("Account created. Log in with your new credentials.");
      } else {
        setUser(data.user);
        await loadTasks();
      }
    } catch (requestError) {
      setError(requestError.message || "Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function addNewTask(event) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: taskText }),
    });
    const data = await readApiResponse(response);
    if (!response.ok) return setError(data.error || "Could not add task.");
    setTasks((current) => [data.task, ...current]);
    setTaskText("");
  }

  async function toggleTask(task) {
    setError("");
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    const data = await readApiResponse(response);
    if (!response.ok) return setError(data.error || "Could not update task.");
    setTasks((current) => current.map((item) => item.id === task.id ? data.task : item)
      .sort((a, b) => Number(a.completed) - Number(b.completed)));
  }

  async function deleteTask(taskId) {
    setError("");
    const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    const data = await readApiResponse(response);
    if (!response.ok) return setError(data.error || "Could not delete task.");
    setTasks((current) => current.filter((task) => task.id !== taskId));
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setTasks([]);
    setView("login");
    setPassword("");
    setError("");
  }

  const remaining = tasks.filter((task) => !task.completed).length;

  if (loading) return <main className="loading-screen">DAYMARK<span>.</span></main>;

  return (
    <main className="app-shell">
      <aside className="side-rail">
        <a className="wordmark" href="#home">daymark<span>.</span></a>
        <div className="rail-label">YOUR SPACE</div>
        <div className={`rail-link ${user ? "active" : ""}`}><span className="rail-icon">◷</span> My tasks</div>
        <div className="rail-bottom"><span className="rail-status" /> PRIVATE BY DEFAULT</div>
      </aside>

      <section className="main-area" id="home">
        <header className="topbar">
          <span>MONDAY, OCTOBER 3</span>
          {user && <button className="text-button" onClick={logout}>Log out <span aria-hidden="true">↗</span></button>}
        </header>

        {!user ? (
          <div className="auth-layout">
            <section className="auth-intro">
              <p className="eyebrow">A little more focused</p>
              <h1>Make room<br />for <em>what matters.</em></h1>
              <p className="intro-copy">A calm place for your to-dos. Yours alone, always.</p>
              <div className="sun-mark" aria-hidden="true">✳</div>
            </section>
            <section className="auth-form-wrap">
              <div className="form-heading">
                <span className="form-step">{view === "login" ? "01 / SIGN IN" : "02 / NEW ACCOUNT"}</span>
                <h2>{view === "login" ? "Welcome back." : "Start fresh."}</h2>
                <p>{view === "login" ? "Pick up where you left off." : "Create your personal task space."}</p>
              </div>
              <form className="auth-form" onSubmit={submitAuth}>
                <label className="field-label" htmlFor="username">USERNAME</label>
                <input id="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} maxLength={32} />
                <label className="field-label" htmlFor="password">PASSWORD</label>
                <input id="password" type="password" autoComplete={view === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={128} />
                {error && <p className={`notice ${error.startsWith("Account created") ? "success" : ""}`} role="alert">{error}</p>}
                <button className="primary-button" type="submit" disabled={busy}>{busy ? "PLEASE WAIT…" : view === "login" ? "LOG IN" : "CREATE ACCOUNT"}<span aria-hidden="true">↗</span></button>
              </form>
              <p className="switch-auth">{view === "login" ? "New around here?" : "Already have an account?"} <button onClick={() => { setView(view === "login" ? "register" : "login"); setError(""); }}>{view === "login" ? "Create an account" : "Log in"}</button></p>
            </section>
          </div>
        ) : (
          <section className="task-content">
            <div className="task-heading">
              <p className="eyebrow">YOUR PERSONAL LIST</p>
              <h1>Good things<br />get <em>done.</em></h1>
              <p className="greeting">A clear space for {user.username ? `@${user.username}` : "you"}.</p>
            </div>
            <form className="add-task-form" onSubmit={addNewTask}>
              <span className="plus-mark" aria-hidden="true">+</span>
              <input aria-label="New task" placeholder="What needs doing?" value={taskText} onChange={(event) => setTaskText(event.target.value)} maxLength={500} />
              <button type="submit" aria-label="Add task" title="Add task">↵</button>
            </form>
            {error && <p className="notice task-notice" role="alert">{error}</p>}
            <div className="list-meta"><span>YOUR TASKS</span><span>{remaining} TO DO</span></div>
            {tasks.length === 0 ? (
              <div className="empty-state"><span aria-hidden="true">✳</span><p>Nothing on the list yet.</p><small>Add a task above and give your day a starting point.</small></div>
            ) : (
              <ul className="task-list">
                {tasks.map((task) => (
                  <li className={`task-row ${task.completed ? "is-complete" : ""}`} key={task.id}>
                    <button className="check-button" onClick={() => toggleTask(task)} aria-label={task.completed ? `Mark ${task.text} incomplete` : `Complete ${task.text}`} aria-pressed={task.completed}>{task.completed ? "✓" : ""}</button>
                    <span className="task-text">{task.text}</span>
                    <button className="delete-button" onClick={() => deleteTask(task.id)} aria-label={`Delete ${task.text}`} title="Delete task">×</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <footer className="page-footer"><span>ONE THING AT A TIME.</span><span>DAYMARK <span className="footer-dot">●</span> 2026</span></footer>
      </section>
    </main>
  );
}