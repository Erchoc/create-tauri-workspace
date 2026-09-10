use std::path::PathBuf;

use app_core::Settings;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager, Runtime};

pub const APPLICATION_SLUG: &str = "__PROJECT_SLUG__";

pub fn config_path() -> PathBuf {
    app_core::default_config_path(APPLICATION_SLUG)
}

/// Loads settings, preferring the user's file over the bundled defaults.
///
/// Reading settings must never stop the application from starting, so every
/// failure degrades to the next source and is logged rather than returned.
pub fn load<R: Runtime>(app: &AppHandle<R>) -> Settings {
    match app_core::load_settings(&config_path()) {
        Ok(Some(settings)) => return settings,
        Ok(None) => {}
        Err(error) => log::warn!("Ignoring unreadable settings file: {error}"),
    }

    bundled_defaults(app).unwrap_or_else(|error| {
        // A development build runs the binary outside a bundle, so the
        // packaged defaults are simply absent. Only a file that exists and
        // cannot be read is worth a warning.
        match error {
            DefaultsError::Missing => {
                log::debug!("No bundled defaults; using built-in values.");
            }
            DefaultsError::Unreadable(detail) => {
                log::warn!("Bundled defaults are unusable: {detail}");
            }
        }
        Settings::default()
    })
}

enum DefaultsError {
    Missing,
    Unreadable(String),
}

pub fn save(settings: &Settings) -> std::io::Result<()> {
    app_core::save_settings(&config_path(), settings)
}

fn bundled_defaults<R: Runtime>(app: &AppHandle<R>) -> Result<Settings, DefaultsError> {
    let path = app
        .path()
        .resolve("defaults/settings.json", BaseDirectory::Resource)
        .map_err(|_| DefaultsError::Missing)?;
    let contents = match std::fs::read_to_string(path) {
        Ok(contents) => contents,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return Err(DefaultsError::Missing);
        }
        Err(error) => return Err(DefaultsError::Unreadable(error.to_string())),
    };
    app_core::parse_settings(&contents).map_err(DefaultsError::Unreadable)
}
