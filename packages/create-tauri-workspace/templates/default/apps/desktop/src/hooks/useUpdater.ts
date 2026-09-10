import { useCallback, useEffect, useRef, useState } from "react";

import { describeError, isDesktop, readUpdateStatus } from "../lib/bridge";

export type UpdateState =
  /** Running in a browser: there is nothing to update. */
  | { kind: "unsupported" }
  /** The project has not run `bun run updater:init` yet. */
  | { kind: "disabled" }
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "current" }
  | { kind: "available"; version: string; notes: string | undefined }
  | { kind: "downloading"; percent: number | undefined }
  | { kind: "ready" }
  | { kind: "failed"; message: string };

type Update = Awaited<
  ReturnType<typeof import("@tauri-apps/plugin-updater").check>
>;

export function useUpdater(autoCheck: boolean) {
  const [state, setState] = useState<UpdateState>(
    isDesktop ? { kind: "idle" } : { kind: "unsupported" },
  );
  const pending = useRef<NonNullable<Update> | null>(null);
  const checked = useRef(false);

  /**
   * `silent` is used by the check that runs at launch. A user who is offline
   * should not be met with an error banner they did not ask for; only a check
   * they started themselves reports a failure.
   */
  const check = useCallback(async (silent = false): Promise<void> => {
    if (!isDesktop) {
      return;
    }
    if (!silent) {
      setState({ kind: "checking" });
    }
    try {
      const status = await readUpdateStatus();
      if (!status.configured) {
        setState({ kind: "disabled" });
        return;
      }
      const { check: checkForUpdate } = await import(
        "@tauri-apps/plugin-updater"
      );
      const update = await checkForUpdate();
      if (!update) {
        setState({ kind: "current" });
        return;
      }
      pending.current = update;
      setState({
        kind: "available",
        version: update.version,
        notes: update.body ?? undefined,
      });
    } catch (error) {
      if (silent) {
        console.warn("Automatic update check failed", error);
        setState({ kind: "idle" });
        return;
      }
      setState({ kind: "failed", message: describeError(error) });
    }
  }, []);

  const install = useCallback(async (): Promise<void> => {
    const update = pending.current;
    if (!update) {
      return;
    }
    setState({ kind: "downloading", percent: undefined });
    try {
      let downloaded = 0;
      let total: number | undefined;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          setState({
            kind: "downloading",
            percent: total ? Math.round((downloaded / total) * 100) : undefined,
          });
        }
      });
      setState({ kind: "ready" });
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (error) {
      setState({ kind: "failed", message: describeError(error) });
    }
  }, []);

  // One automatic check per launch, and only when the user allows it.
  useEffect(() => {
    if (!autoCheck || checked.current || !isDesktop) {
      return;
    }
    checked.current = true;
    void check(true);
  }, [autoCheck, check]);

  return { state, check, install };
}
