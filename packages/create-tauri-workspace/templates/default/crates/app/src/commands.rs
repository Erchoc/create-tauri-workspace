use app_core::{AppInfo, Settings};
use tauri::{AppHandle, Runtime};

use crate::settings;
use crate::updater::{self, UpdateStatus};

#[tauri::command]
pub fn normalize(input: String) -> String {
    app_core::normalize(&input)
}

#[tauri::command]
pub fn app_info<R: Runtime>(app: AppHandle<R>) -> AppInfo {
    let package = app.package_info();
    app_core::app_info(
        &package.name,
        &package.version.to_string(),
        settings::APPLICATION_SLUG,
    )
}

#[tauri::command]
pub fn update_status<R: Runtime>(app: AppHandle<R>) -> UpdateStatus {
    updater::status(&app)
}

#[tauri::command]
pub fn load_settings<R: Runtime>(app: AppHandle<R>) -> Settings {
    settings::load(&app)
}

#[tauri::command]
pub fn save_settings(settings: Settings) -> Result<(), String> {
    settings::save(&settings).map_err(|error| error.to_string())
}
