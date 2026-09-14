mod model;
mod platform;
mod storage;

pub use model::{AppInfo, Settings, Theme};
pub use storage::{default_config_path, load_settings, save_settings};

/// Normalizes user input on the native side and hands the value back.
///
/// Native code returns values, never sentences: a string built in Rust cannot
/// be translated by the interface, and the interface is the only layer that
/// knows which language the user reads.
pub fn normalize(input: &str) -> String {
    input.split_whitespace().collect::<Vec<_>>().join(" ")
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
    use super::{app_info, load_settings, normalize, parse_settings, save_settings};
    use crate::model::{Settings, Theme};

    #[test]
    fn collapses_whitespace_in_input() {
        assert_eq!(normalize("  hello   world  "), "hello world");
        assert_eq!(normalize("\t  \n "), "");
        assert_eq!(normalize("\u{6d4b}\u{8bd5}"), "\u{6d4b}\u{8bd5}");
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
        assert_eq!(settings.language, "system");
        assert!(settings.automatic_updates);
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
            language: "zh-CN".to_owned(),
            automatic_updates: false,
        };
        save_settings(&path, &settings).unwrap();
        assert_eq!(load_settings(&path).unwrap(), Some(settings));

        std::fs::remove_dir_all(&directory).unwrap();
    }
}
