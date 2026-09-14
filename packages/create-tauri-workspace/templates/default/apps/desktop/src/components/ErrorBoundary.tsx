import { Component, type ErrorInfo, type ReactNode } from "react";

import { resolveLocale, translator } from "../lib/i18n";

type Props = { children: ReactNode };
type State = { message: string | null };

/**
 * Keeps a rendering error from leaving a blank desktop window.
 *
 * A user cannot open developer tools in a packaged build, so the message has
 * to reach the screen and the log.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { message: null };

  static getDerivedStateFromError(error: unknown): State {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Interface error", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.message === null) {
      return this.props.children;
    }
    const t = translator(resolveLocale("system"));
    return (
      <main className="shell">
        <div className="shell-content" style={{ justifyContent: "center" }}>
          <div className="card">
            <span className="card-label">{t("error.title")}</span>
            <h1 className="section-heading">{t("error.heading")}</h1>
            <p className="lede">{this.state.message}</p>
            <div className="row">
              <button
                className="button"
                type="button"
                onClick={() => {
                  this.setState({ message: null });
                }}
              >
                {t("error.retry")}
              </button>
              <button
                className="button"
                data-variant="secondary"
                type="button"
                onClick={() => {
                  window.location.reload();
                }}
              >
                {t("error.reload")}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }
}
