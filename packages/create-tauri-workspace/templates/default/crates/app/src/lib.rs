#[tauri::command]
fn greet(name: String) -> String {
    app_core::greeting(&name)
}

#[tauri::command]
fn app_info() -> app_core::AppInfo {
    app_core::app_info(
        "__PROJECT_DISPLAY_NAME__",
        env!("CARGO_PKG_VERSION"),
        "__PROJECT_SLUG__",
    )
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, app_info])
        .run(tauri::generate_context!())
        .expect("failed to run Tauri application");
}
