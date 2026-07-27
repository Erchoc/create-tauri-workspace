mod model;
mod platform;
mod storage;

pub use model::AppInfo;

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
        config_path: storage::default_config_path(application_slug)
            .display()
            .to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::{app_info, greeting};

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
}
