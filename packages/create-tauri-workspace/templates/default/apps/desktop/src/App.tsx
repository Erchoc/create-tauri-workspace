import { FormEvent, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type AppInfo = {
  name: string;
  version: string;
  platform: string;
  architecture: string;
  configPath: string;
};

const fallbackInfo: AppInfo = {
  name: "__PROJECT_DISPLAY_NAME__",
  version: "web preview",
  platform: "browser",
  architecture: "development",
  configPath: "Available in the Tauri window",
};

export default function App() {
  const [name, setName] = useState("desktop");
  const [message, setMessage] = useState("Native command ready");
  const [info, setInfo] = useState<AppInfo>(fallbackInfo);

  useEffect(() => {
    invoke<AppInfo>("app_info").then(setInfo).catch(() => {
      setInfo(fallbackInfo);
    });
  }, []);

  async function greet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setMessage(await invoke<string>("greet", { name }));
    } catch {
      setMessage("Run bun run dev to call the Rust backend.");
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <span className="eyebrow">TAURI 2 WORKSPACE</span>
          <h1>{info.name}</h1>
          <p className="lede">
            React on the surface, focused Rust crates underneath, and native
            installers for every supported desktop platform.
          </p>
        </div>
        <div className="status" aria-label="Application status">
          <span className="status-dot" />
          {message}
        </div>
      </section>

      <section className="grid">
        <article className="card command-card">
          <span className="card-label">IPC sample</span>
          <h2>Call Rust from React</h2>
          <form onSubmit={greet}>
            <label htmlFor="name">Name</label>
            <div className="input-row">
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <button type="submit">Invoke</button>
            </div>
          </form>
        </article>

        <article className="card">
          <span className="card-label">Runtime</span>
          <dl>
            <div>
              <dt>Version</dt>
              <dd>{info.version}</dd>
            </div>
            <div>
              <dt>Platform</dt>
              <dd>{info.platform}</dd>
            </div>
            <div>
              <dt>Architecture</dt>
              <dd>{info.architecture}</dd>
            </div>
          </dl>
        </article>

        <article className="card path-card">
          <div className="path-heading">
            <span className="card-label">Local state</span>
            <h2>Configuration path</h2>
          </div>
          <code>{info.configPath}</code>
        </article>
      </section>
    </main>
  );
}
