import { useEffect, useState, type FormEvent } from "react";

import { ConfirmDialog } from "./components/ConfirmDialog";
import { Segmented } from "./components/Segmented";
import { UpdateBanner } from "./components/UpdateBanner";
import { useSettings } from "./hooks/useSettings";
import { useUpdater } from "./hooks/useUpdater";
import {
  describeError,
  isDesktop,
  normalizeInput,
  readAppInfo,
  type AppInfo,
} from "./lib/bridge";
import { LOCALE_NAMES, type LanguagePreference } from "./lib/i18n";
import type { Theme } from "./lib/bridge";

/**
 * The result of one native call, kept as data. Storing the sentence instead
 * would freeze it in whichever language was active when it was produced.
 */
type Outcome =
  | { kind: "value"; value: string }
  | { kind: "empty" }
  | { kind: "browser" }
  /** Errors come from the native side already worded; there is nothing to translate. */
  | { kind: "error"; message: string };

export default function App() {
  const { settings, update, loaded, t } = useSettings();
  const updater = useUpdater(loaded ? settings.automaticUpdates : null);
  const [confirmingInstall, setConfirmingInstall] = useState(false);
  const [info, setInfo] = useState<AppInfo | undefined>(undefined);
  const [name, setName] = useState("");
  const [outcome, setOutcome] = useState<Outcome | undefined>(undefined);

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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const value = await normalizeInput(name);
      setOutcome(value ? { kind: "value", value } : { kind: "empty" });
    } catch (error) {
      setOutcome(
        isDesktop
          ? { kind: "error", message: describeError(error) }
          : { kind: "browser" },
      );
    }
  }

  // Translated here rather than where it is produced, so that changing the
  // language also re-words a result that is already on screen.
  function describeOutcome(value: Outcome): string {
    switch (value.kind) {
      case "value":
        return t("demo.result", { value: value.value });
      case "empty":
        return t("demo.empty");
      case "browser":
        return t("demo.browserHint");
      case "error":
        return value.message;
    }
  }

  const busy =
    updater.state.kind === "checking" ||
    updater.state.kind === "downloading" ||
    updater.state.kind === "installing";
  const readyVersion =
    updater.state.kind === "ready" ? updater.state.version : undefined;
  const updatesAvailable =
    updater.state.kind !== "unsupported" && updater.state.kind !== "disabled";

  const themeOptions: readonly { value: Theme; label: string }[] = [
    { value: "system", label: t("theme.system") },
    { value: "light", label: t("theme.light") },
    { value: "dark", label: t("theme.dark") },
  ];
  const languageOptions: readonly { value: LanguagePreference; label: string }[] =
    [
      { value: "system", label: t("language.system") },
      ...(
        Object.entries(LOCALE_NAMES) as [keyof typeof LOCALE_NAMES, string][]
      ).map(([value, label]) => ({ value, label })),
    ];

  return (
    <main className="shell">
      <header className="shell-header">
        <div>
          <h1 className="title">{info?.name ?? "__PROJECT_DISPLAY_NAME__"}</h1>
          <p className="lede">{t("app.tagline")}</p>
        </div>
        <div className="header-actions">
          <Segmented
            label={t("language.label")}
            value={settings.language}
            options={languageOptions}
            onChange={(language) => {
              update({ language });
            }}
          />
          <Segmented
            label={t("theme.label")}
            value={settings.theme}
            options={themeOptions}
            onChange={(theme) => {
              update({ theme });
            }}
          />
          {updatesAvailable && (
            <button
              className="button"
              data-variant="secondary"
              type="button"
              disabled={busy}
              onClick={() => {
                void updater.check();
              }}
            >
              {t("update.checkNow")}
            </button>
          )}
        </div>
      </header>

      <div className="shell-content">
        <UpdateBanner
          state={updater.state}
          t={t}
          onDownload={() => {
            void updater.download(false);
          }}
          onInstall={() => {
            setConfirmingInstall(true);
          }}
        />

        <div className="row">
          <span className="badge" data-tone="success">
            <span className="badge-dot" />
            {outcome ? describeOutcome(outcome) : t("status.ready")}
          </span>
        </div>

        <div className="grid">
          <article className="card">
            <span className="card-label">{t("demo.label")}</span>
            <h2 className="section-heading">{t("demo.title")}</h2>
            <form className="field" onSubmit={onSubmit}>
              <label htmlFor="name">{t("demo.name")}</label>
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
                  {t("demo.submit")}
                </button>
              </div>
            </form>
          </article>

          <article className="card">
            <span className="card-label">{t("runtime.label")}</span>
            <dl className="definition-list">
              <div>
                <dt>{t("runtime.version")}</dt>
                <dd>{info?.version ?? "—"}</dd>
              </div>
              <div>
                <dt>{t("runtime.platform")}</dt>
                <dd>{info?.platform ?? "—"}</dd>
              </div>
              <div>
                <dt>{t("runtime.architecture")}</dt>
                <dd>{info?.architecture ?? "—"}</dd>
              </div>
              <div>
                <dt>{t("runtime.updates")}</dt>
                <dd>
                  {updater.state.kind === "disabled"
                    ? t("runtime.updatesUnconfigured")
                    : updater.state.kind === "unsupported"
                      ? t("runtime.updatesDesktopOnly")
                      : t("runtime.updatesEnabled")}
                </dd>
              </div>
            </dl>
          </article>

          <article className="card grid-wide">
            <span className="card-label">{t("storage.label")}</span>
            <h2 className="section-heading">{t("storage.title")}</h2>
            <code className="code-block">{info?.configPath ?? "—"}</code>
            <label className="row">
              <input
                type="checkbox"
                checked={settings.automaticUpdates}
                onChange={(event) => {
                  update({ automaticUpdates: event.target.checked });
                }}
              />
              {t("storage.automaticUpdates")}
            </label>
          </article>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingInstall}
        title={t("update.confirmTitle")}
        description={t("update.confirmBody", {
          name: info?.name ?? "",
          version: readyVersion ?? "",
        })}
        confirmLabel={t("update.confirmAccept")}
        cancelLabel={t("update.confirmCancel")}
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
