use std::env;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // set default log level to value of TAURI_ENV_TSLOG_LEVEL, defaulting to INFO
    let log_level_string = env::var("TAURI_ENV_TSLOG_LEVEL").unwrap_or("INFO".to_string());
    let log_level = match log_level_string.as_str() {
        "INFO" => tauri_plugin_log::log::LevelFilter::Info,
        "DEBUG" => tauri_plugin_log::log::LevelFilter::Debug,
        "TRACE" => tauri_plugin_log::log::LevelFilter::Trace,
        "WARN" => tauri_plugin_log::log::LevelFilter::Warn,
        "ERROR" => tauri_plugin_log::log::LevelFilter::Error,
        _ => tauri_plugin_log::log::LevelFilter::Info,
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_log::Builder::new().level(log_level).build())
        .plugin(
            // echo log messages to webview console
            tauri_plugin_log::Builder::new()
                .level(log_level)
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Webview,
                ))
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
