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
  /** Found, not downloaded. Reached when automatic downloads are off. */
  | { kind: "available"; version: string; notes: string | undefined }
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
 * Checking and downloading are separate decisions. The check always runs, so
 * someone who turned automatic downloads off still learns that an update
 * exists — it costs a few kilobytes. The download is what the preference
 * governs, because it spends real bandwidth. Installing is never automatic
 * under either setting: it closes the application.
 *
 * `automaticDownload` is null until the stored preference has loaded. The
 * check waits for it: firing earlier would decide whether to download using a
 * default the user may have turned off.
 */
export function useUpdater(automaticDownload: boolean | null) {
  const [state, setState] = useState<UpdateState>(
    isDesktop ? { kind: "idle" } : { kind: "unsupported" },
  );
  const pending = useRef<Update | null>(null);
  const started = useRef(false);

  const download = useCallback(
    async (silent: boolean): Promise<void> => {
      const update = pending.current;
      if (!update) {
        return;
      }
      setState({ kind: "downloading", percent: undefined, silent });
      try {
        let downloaded = 0;
        let total: number | undefined;

        await update.download((event) => {
          if (event.event === "Started") {
            total = event.data.contentLength;
          } else if (event.event === "Progress") {
            downloaded += event.data.chunkLength;
            setState({
              kind: "downloading",
              percent: total
                ? Math.round((downloaded / total) * 100)
                : undefined,
              silent,
            });
          }
        });

        setState({
          kind: "ready",
          version: update.version,
          notes: update.body ?? undefined,
        });
      } catch (error) {
        if (silent) {
          // A failed background download should leave the update offered
          // rather than replace it with an error the user did not ask for.
          console.warn("Automatic download failed", error);
          setState({
            kind: "available",
            version: update.version,
            notes: update.body ?? undefined,
          });
          return;
        }
        setState({ kind: "failed", message: describeError(error) });
      }
    },
    [],
  );

  /**
   * `silent` is used by the check that runs at launch, so that being offline
   * does not raise an error banner nobody asked for.
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
        if (automaticDownload) {
          await download(silent);
        } else {
          setState({
            kind: "available",
            version: update.version,
            notes: update.body ?? undefined,
          });
        }
      } catch (error) {
        if (silent) {
          console.warn("Automatic update check failed", error);
          setState({ kind: "idle" });
          return;
        }
        setState({ kind: "failed", message: describeError(error) });
      }
    },
    [automaticDownload, download],
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

  // One check per launch, once the preference is known. It runs whichever way
  // that preference points.
  useEffect(() => {
    if (automaticDownload === null || started.current || !isDesktop) {
      return;
    }
    started.current = true;
    void check(true);
  }, [automaticDownload, check]);

  return { state, check, download, install };
}
