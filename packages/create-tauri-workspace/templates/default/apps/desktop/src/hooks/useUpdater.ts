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
  /** `silent` downloads happen in the background and stay out of the way. */
  | { kind: "downloading"; percent: number | undefined; silent: boolean }
  /** Downloaded and verified. Nothing is installed until the user agrees. */
  | { kind: "ready"; version: string; notes: string | undefined }
  | { kind: "installing" }
  | { kind: "failed"; message: string };

type Update = NonNullable<
  Awaited<ReturnType<typeof import("@tauri-apps/plugin-updater").check>>
>;

/**
 * Drives the update lifecycle: check, download, then install on request.
 *
 * The download runs as soon as an update is found, so that agreeing to install
 * is instant rather than a wait behind a progress bar. Installing is never
 * automatic: it closes the application, which has to be the user's decision.
 */
export function useUpdater(automatic: boolean) {
  const [state, setState] = useState<UpdateState>(
    isDesktop ? { kind: "idle" } : { kind: "unsupported" },
  );
  const pending = useRef<Update | null>(null);
  const started = useRef(false);

  const download = useCallback(
    async (update: Update, silent: boolean): Promise<void> => {
      setState({ kind: "downloading", percent: undefined, silent });
      let downloaded = 0;
      let total: number | undefined;

      await update.download((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          setState({
            kind: "downloading",
            percent: total ? Math.round((downloaded / total) * 100) : undefined,
            silent,
          });
        }
      });

      setState({
        kind: "ready",
        version: update.version,
        notes: update.body ?? undefined,
      });
    },
    [],
  );

  /**
   * `silent` is used by the check that runs at launch. Someone who is offline
   * should not meet an error banner they did not ask for, and a background
   * download should not take over the interface.
   */
  const check = useCallback(
    async (silent = false): Promise<void> => {
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
          setState(silent ? { kind: "idle" } : { kind: "current" });
          return;
        }

        pending.current = update;
        await download(update, silent);
      } catch (error) {
        if (silent) {
          console.warn("Automatic update failed", error);
          setState({ kind: "idle" });
          return;
        }
        setState({ kind: "failed", message: describeError(error) });
      }
    },
    [download],
  );

  /** Installs the downloaded update and restarts. Ask the user first. */
  const install = useCallback(async (): Promise<void> => {
    const update = pending.current;
    if (!update) {
      return;
    }
    setState({ kind: "installing" });
    try {
      await update.install();
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (error) {
      setState({ kind: "failed", message: describeError(error) });
    }
  }, []);

  // One automatic check per launch, and only when the user allows it.
  useEffect(() => {
    if (!automatic || started.current || !isDesktop) {
      return;
    }
    started.current = true;
    void check(true);
  }, [automatic, check]);

  return { state, check, install };
}
