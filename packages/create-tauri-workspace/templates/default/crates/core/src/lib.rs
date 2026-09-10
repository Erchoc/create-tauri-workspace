mod model;
mod platform;
mod storage;

pub use model::{AppInfo, Settings, Theme};
pub use storage::{default_config_path, load_settings, save_settings};

pub fn greeting(name: &str) -> String {
    let name = name.trim();
    if name.is_empty() {
        "Hello from Rust.".to_owned()
    } else {
        format!("Hello, {name}. Rust is connected.")
    }
}

pub fn app_info(name: &str, version: &str, application_slug: &str) -> AppInfo {
    let platform = platform::current();
    AppInfo {
        name: name.into(),
        version: version.into(),
        platform: platform.os.into(),
        architecture: platform.architecture.into(),
        config_path: default_config_path(application_slug).display().to_string(),
    }
}

/// Parses the settings file that ships inside the application bundle.
///
/// The bundled file is the single source of truth for defaults, so a change
/// there does not need a matching change in Rust.
pub fn parse_settings(contents: &str) -> Result<Settings, String> {
    serde_json::from_str(contents).map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::{app_info, greeting, load_settings, parse_settings, save_settings};
    use crate::model::{Settings, Theme};

    #[test]
    fn greets_a_named_user() {
        assert_eq!(greeting("Tauri"), "Hello, Tauri. Rust is connected.");
    }

    #[test]
    fn builds_serializable_application_info() {
        let info = app_info("Example", "1.2.3", "example");
        assert_eq!(info.name, "Example");
        assert_eq!(info.version, "1.2.3");
        assert!(info.config_path.ends_with("settings.json"));
    }

    #[test]
    fn defaults_to_the_system_theme() {
        let settings = Settings::default();
        assert_eq!(settings.theme, Theme::System);
        assert!(settings.auto_update_check);
    }

    #[test]
    fn parses_the_bundled_defaults() {
        let bundled = include_str!("../../../resources/defaults/settings.json");
        assert_eq!(parse_settings(bundled).unwrap(), Settings::default());
    }

    #[test]
    fn rejects_unknown_settings_keys() {
        assert!(parse_settings(r#"{"nope": 1}"#).is_err());
    }

    #[test]
    fn round_trips_settings_through_a_file() {
        let directory =
            std::env::temp_dir().join(format!("app-core-settings-{}", std::process::id()));
        let path = directory.join("settings.json");
        let _ = std::fs::remove_dir_all(&directory);

        assert_eq!(load_settings(&path).unwrap(), None);

        let settings = Settings {
            theme: Theme::Dark,
            auto_update_check: false,
        };
        save_settings(&path, &settings).unwrap();
        assert_eq!(load_settings(&path).unwrap(), Some(settings));

        std::fs::remove_dir_all(&directory).unwrap();
    }
}
