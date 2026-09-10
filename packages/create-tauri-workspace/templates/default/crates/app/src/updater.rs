use serde::Serialize;
use tauri::{AppHandle, Runtime};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStatus {
    /// True once `bun run updater:init` has written a public key.
    pub configured: bool,
    pub current_version: String,
}

fn public_key<R: Runtime>(app: &AppHandle<R>) -> Option<String> {
    let key = app
        .config()
        .plugins
        .0
        .get("updater")?
        .get("pubkey")?
        .as_str()?
        .trim();
    (!key.is_empty()).then(|| key.to_owned())
}

pub fn status<R: Runtime>(app: &AppHandle<R>) -> UpdateStatus {
    UpdateStatus {
        configured: public_key(app).is_some(),
        current_version: app.package_info().version.to_string(),
    }
}

/// Registers the updater only when a signing public key is configured.
///
/// A project that has not run `bun run updater:init` has no key to verify a
/// download against, so the plugin stays unregistered and the interface hides
/// the update controls instead of offering an unverifiable install.
#[cfg(desktop)]
pub fn register<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    if public_key(app).is_some() {
        app.plugin(tauri_plugin_updater::Builder::new().build())?;
    }
    Ok(())
}
