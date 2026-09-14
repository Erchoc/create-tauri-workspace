import type { UpdateState } from "../hooks/useUpdater";
import type { Translate } from "../lib/i18n";

type Props = {
  state: UpdateState;
  t: Translate;
  onInstall: () => void;
};

/**
 * Reports update progress, and stays silent when there is nothing to say.
 *
 * A background download reports nothing until it has finished: the user did
 * not ask for it, and a half-finished download is not actionable. "disabled"
 * and "unsupported" render nothing either — a project without signing should
 * not advertise an update path it cannot deliver.
 */
export function UpdateBanner({ state, t, onInstall }: Props) {
  if (
    state.kind === "idle" ||
    state.kind === "disabled" ||
    state.kind === "unsupported" ||
    state.kind === "current" ||
    (state.kind === "downloading" && state.silent)
  ) {
    return null;
  }

  if (state.kind === "failed") {
    return (
      <div className="banner" data-tone="danger" role="alert">
        <span className="banner-message">
          {t("update.failed", { message: state.message })}
        </span>
      </div>
    );
  }

  if (state.kind === "ready") {
    return (
      <div className="banner" role="status">
        <span className="banner-message">
          {t("update.ready", { version: state.version })}
          {state.notes ? ` ${state.notes}` : ""}
        </span>
        <button className="button" type="button" onClick={onInstall}>
          {t("update.install")}
        </button>
      </div>
    );
  }

  return (
    <div className="banner" role="status">
      <span className="banner-message">
        {state.kind === "checking" && t("update.checking")}
        {state.kind === "downloading" &&
          (state.percent === undefined
            ? t("update.downloading")
            : t("update.downloadingPercent", { percent: state.percent }))}
        {state.kind === "installing" && t("update.installing")}
      </span>
    </div>
  );
}
