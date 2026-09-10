import { useEffect, useState, type FormEvent } from "react";

import { ConfirmDialog } from "./components/ConfirmDialog";
import { ThemeControl } from "./components/ThemeControl";
import { UpdateBanner } from "./components/UpdateBanner";
import { useSettings } from "./hooks/useSettings";
import { useUpdater } from "./hooks/useUpdater";
import {
  describeError,
  greet,
  isDesktop,
  readAppInfo,
  type AppInfo,
} from "./lib/bridge";

const browserPreview: AppInfo = {
  name: "__PROJECT_DISPLAY_NAME__",
  version: "web preview",
  platform: "browser",
  architecture: "development",
  configPath: "Available in the Tauri window",
};

export default function App() {
  const { settings, update, loaded } = useSettings();
  const updater = useUpdater(loaded && settings.automaticUpdates);
  const [confirmingInstall, setConfirmingInstall] = useState(false);
  const [info, setInfo] = useState<AppInfo>(browserPreview);
  const [name, setName] = useState("desktop");
  const [message, setMessage] = useState("Native command ready");

  useEffect(() => {
    if (!isDesktop) {
      return;
    }
    let active = true;
    readAppInfo()
      .then((value) => {
        if (active) {
          setInfo(value);
        }
      })
      .catch((error: unknown) => {
        console.error("Could not read application info", error);
      });
    return () => {
      active = false;
    };
  }, []);

  async function onGreet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setMessage(await greet(name));
    } catch (error) {
      setMessage(
        isDesktop
          ? describeError(error)
          : "Run bun run dev to call the Rust backend.",
      );
    }
  }

  const busy =
    updater.state.kind === "checking" ||
    updater.state.kind === "downloading" ||
    updater.state.kind === "installing";
  const readyVersion =
    updater.state.kind === "ready" ? updater.state.version : undefined;

  return (
    <main className="shell">
      <header className="shell-header">
        <div>
          <span className="eyebrow">Tauri 2 workspace</span>
          <h1 className="title">{info.name}</h1>
          <p className="lede">
            React on the surface, focused Rust crates underneath, and signed
            installers for every supported desktop platform.
          </p>
        </div>
        <div className="header-actions">
          <ThemeControl
            value={settings.theme}
            onChange={(theme) => {
              update({ theme });
            }}
          />
          {updater.state.kind !== "unsupported" &&
            updater.state.kind !== "disabled" && (
              <button
                className="button"
                data-variant="secondary"
                type="button"
                disabled={busy}
                onClick={() => {
                  void updater.check();
                }}
              >
                Check for updates
              </button>
            )}
        </div>
      </header>

      <div className="shell-content">
        <UpdateBanner
          state={updater.state}
          onInstall={() => {
            setConfirmingInstall(true);
          }}
        />

        <div className="row">
          <span className="badge" data-tone="success">
            <span className="badge-dot" />
            {message}
          </span>
        </div>

        <div className="grid">
          <article className="card">
            <span className="card-label">IPC sample</span>
            <h2 className="section-heading">Call Rust from React</h2>
            <form className="field" onSubmit={onGreet}>
              <label htmlFor="name">Name</label>
              <div className="row">
                <input
                  className="input"
                  id="name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                  }}
                />
                <button className="button" type="submit">
                  Invoke
                </button>
              </div>
            </form>
          </article>

          <article className="card">
            <span className="card-label">Runtime</span>
            <dl className="definition-list">
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
              <div>
                <dt>Updates</dt>
                <dd>
                  {updater.state.kind === "disabled"
                    ? "Not configured"
                    : updater.state.kind === "unsupported"
                      ? "Desktop only"
                      : "Enabled"}
                </dd>
              </div>
            </dl>
          </article>

          <article className="card grid-wide">
            <span className="card-label">Local state</span>
            <h2 className="section-heading">Configuration path</h2>
            <code className="code-block">{info.configPath}</code>
            <label className="row">
              <input
                type="checkbox"
                checked={settings.automaticUpdates}
                onChange={(event) => {
                  update({ automaticUpdates: event.target.checked });
                }}
              />
              Download updates automatically
            </label>
          </article>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingInstall}
        title="Install the update?"
        description={`${info.name} will close, install version ${readyVersion ?? ""}, and reopen. Save your work before continuing.`}
        confirmLabel="Close and install"
        onConfirm={() => {
          setConfirmingInstall(false);
          void updater.install();
        }}
        onCancel={() => {
          setConfirmingInstall(false);
        }}
      />
    </main>
  );
}
