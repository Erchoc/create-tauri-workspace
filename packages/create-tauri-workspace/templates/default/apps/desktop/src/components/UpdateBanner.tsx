import type { UpdateState } from "../hooks/useUpdater";

type Props = {
  state: UpdateState;
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
export function UpdateBanner({ state, onInstall }: Props) {
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
          Could not update: {state.message}
        </span>
      </div>
    );
  }

  if (state.kind === "ready") {
    return (
      <div className="banner" role="status">
        <span className="banner-message">
          Version {state.version} is downloaded and ready to install.
          {state.notes ? ` ${state.notes}` : ""}
        </span>
        <button className="button" type="button" onClick={onInstall}>
          Install now
        </button>
      </div>
    );
  }

  return (
    <div className="banner" role="status">
      <span className="banner-message">
        {state.kind === "checking" && "Checking for updates…"}
        {state.kind === "downloading" &&
          (state.percent === undefined
            ? "Downloading the update…"
            : `Downloading the update… ${state.percent}%`)}
        {state.kind === "installing" && "Installing. The application will restart…"}
      </span>
    </div>
  );
}
