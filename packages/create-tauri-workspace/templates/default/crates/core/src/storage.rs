use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use crate::model::Settings;

pub fn default_config_path(application: &str) -> PathBuf {
    base_config_directory()
        .join(application)
        .join("settings.json")
}

/// Reads settings from `path`.
///
/// A missing file is not an error: it means the user has never changed a
/// setting. A malformed file is reported so the caller can decide whether to
/// warn or fall back.
pub fn load_settings(path: &Path) -> io::Result<Option<Settings>> {
    match fs::read_to_string(path) {
        Ok(contents) => serde_json::from_str(&contents)
            .map(Some)
            .map_err(|error| io::Error::new(io::ErrorKind::InvalidData, error)),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error),
    }
}

/// Writes settings to `path`, creating the parent directory when needed.
///
/// The file is written to a sibling temporary path first so an interrupted
/// write cannot leave a half-written settings file behind.
pub fn save_settings(path: &Path, settings: &Settings) -> io::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let contents = serde_json::to_string_pretty(settings)
        .map_err(|error| io::Error::new(io::ErrorKind::InvalidData, error))?;
    let temporary = path.with_extension("json.tmp");
    fs::write(&temporary, contents)?;
    fs::rename(&temporary, path)
}

#[cfg(target_os = "windows")]
fn base_config_directory() -> PathBuf {
    std::env::var_os("APPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir)
}

#[cfg(target_os = "macos")]
fn base_config_directory() -> PathBuf {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir)
        .join("Library")
        .join("Application Support")
}

#[cfg(all(unix, not(target_os = "macos")))]
fn base_config_directory() -> PathBuf {
    if let Some(path) = std::env::var_os("XDG_CONFIG_HOME") {
        return PathBuf::from(path);
    }
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir)
        .join(".config")
}
