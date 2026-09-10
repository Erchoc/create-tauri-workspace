use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub platform: String,
    pub architecture: String,
    pub config_path: String,
}

/// The colour scheme the interface should follow.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    /// Follow the operating system preference.
    #[default]
    System,
    Light,
    Dark,
}

/// User-editable preferences persisted next to the application data.
///
/// Unknown fields are rejected so that a corrupted file falls back to the
/// bundled defaults instead of silently losing settings.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Settings {
    #[serde(default)]
    pub theme: Theme,
    /// Whether the application may check for updates on start-up.
    #[serde(default = "enabled")]
    pub auto_update_check: bool,
}

fn enabled() -> bool {
    true
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: Theme::default(),
            auto_update_check: enabled(),
        }
    }
}
