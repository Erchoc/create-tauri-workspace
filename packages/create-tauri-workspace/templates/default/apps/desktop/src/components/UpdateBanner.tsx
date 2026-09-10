import type { UpdateState } from "../hooks/useUpdater";

type Props = {
  state: UpdateState;
  onInstall: () => void;
};

/**
 * Reports update progress, and stays silent when there is nothing to say.
 *
 * "disabled" and "unsupported" render nothing: a project that has not set up
 * signing should not advertise an update path it cannot deliver.
 */
export function UpdateBanner({ state, onInstall }: Props) {
  if (
    state.kind === "idle" ||
    state.kind === "disabled" ||
    state.kind === "unsupported" ||
    state.kind === "current"
  ) {
    return null;
  }

  if (state.kind === "failed") {
    return (
      <div className="banner" data-tone="danger" role="alert">
        <span className="banner-message">
          Could not check for updates: {state.message}
        </span>
      </div>
    );
  }

  return (
    <div className="banner" role="status">
      <span className="banner-message">
        {state.kind === "checking" && "Checking for updates…"}
        {state.kind === "available" &&
          `Version ${state.version} is available.${
            state.notes ? ` ${state.notes}` : ""
          }`}
        {state.kind === "downloading" &&
          (state.percent === undefined
            ? "Downloading the update…"
            : `Downloading the update… ${state.percent}%`)}
        {state.kind === "ready" && "Update installed. Restarting…"}
      </span>
      {state.kind === "available" && (
        <button className="button" type="button" onClick={onInstall}>
          Install and restart
        </button>
      )}
    </div>
  );
}
