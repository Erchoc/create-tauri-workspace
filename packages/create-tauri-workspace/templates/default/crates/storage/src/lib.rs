use std::path::PathBuf;

pub fn default_config_path(application: &str) -> PathBuf {
    base_config_directory()
        .join(application)
        .join("settings.json")
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
