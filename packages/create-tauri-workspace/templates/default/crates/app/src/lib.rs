use app_common::AppInfo;

#[tauri::command]
fn greet(name: String) -> String {
    app_core::greeting(&name)
}

#[tauri::command]
fn app_info() -> AppInfo {
    let platform = app_platform::current();
    AppInfo {
        name: "__PROJECT_DISPLAY_NAME__".into(),
        version: env!("CARGO_PKG_VERSION").into(),
        platform: platform.os.into(),
        architecture: platform.architecture.into(),
        config_path: app_storage::default_config_path("__PROJECT_SLUG__")
            .display()
            .to_string(),
        update_channel: app_updater::UpdateChannel::Stable.to_string(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, app_info])
        .run(tauri::generate_context!())
        .expect("failed to run Tauri application");
}
