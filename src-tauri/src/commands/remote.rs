use std::sync::{Arc, Mutex};

use tauri::{AppHandle, Emitter, State};

use rhema_api::{
    CommandError, CommandSink, OscConfig, OscHandle,
    start_osc_listener,
};

/// Tauri-aware implementation of `CommandSink`.
///
/// Routes frontend-bound commands as Tauri events (`app.emit()`)
/// and backend-bound commands as Tauri command invocations.
struct TauriSink {
    app: AppHandle,
}

impl CommandSink for TauriSink {
    fn emit_event(&self, event: &str, payload: &str) -> Result<(), CommandError> {
        self.app
            .emit(event, payload.to_string())
            .map_err(|e| CommandError::DispatchFailed(format!("Tauri emit failed: {e}")))
    }

    fn invoke_backend(&self, action: &str, _args: &str) -> Result<(), CommandError> {
        match action {
            "show_broadcast" => {
                log::info!("Remote control: show broadcast");
                // Emit event for frontend to handle window management
                self.app
                    .emit("remote:show", "{}")
                    .map_err(|e| CommandError::DispatchFailed(e.to_string()))
            }
            "hide_broadcast" => {
                log::info!("Remote control: hide broadcast");
                self.app
                    .emit("remote:hide", "{}")
                    .map_err(|e| CommandError::DispatchFailed(e.to_string()))
            }
            "set_confidence" => {
                // Forward to frontend as an event since confidence lives in Zustand
                self.app
                    .emit("remote:confidence", _args.to_string())
                    .map_err(|e| CommandError::DispatchFailed(e.to_string()))
            }
            _ => Err(CommandError::DispatchFailed(format!(
                "Unknown backend action: {action}"
            ))),
        }
    }
}

/// Managed state for the OSC runtime.
pub struct OscRuntime {
    handle: Option<OscHandle>,
    bound_port: Option<u16>,
}

impl OscRuntime {
    pub fn new() -> Self {
        Self {
            handle: None,
            bound_port: None,
        }
    }
}

impl Default for OscRuntime {
    fn default() -> Self {
        Self::new()
    }
}

/// Start the OSC listener on the given port.
#[tauri::command]
pub async fn start_osc(
    app: AppHandle,
    state: State<'_, Mutex<OscRuntime>>,
    port: Option<u16>,
) -> Result<u16, String> {
    let mut runtime = state.lock().map_err(|e| e.to_string())?;

    if runtime.handle.is_some() {
        return Err("OSC listener is already running".into());
    }

    let config = OscConfig {
        port: port.unwrap_or(8000),
        host: "0.0.0.0".into(),
    };

    let sink = Arc::new(TauriSink { app });

    let result = start_osc_listener(config, sink).map_err(|e| e.to_string())?;

    let bound_port = result.bound_port;
    runtime.handle = Some(result.handle);
    runtime.bound_port = Some(bound_port);

    log::info!("OSC listener started on port {bound_port}");
    Ok(bound_port)
}

/// Stop the OSC listener.
#[tauri::command]
pub async fn stop_osc(state: State<'_, Mutex<OscRuntime>>) -> Result<(), String> {
    let mut runtime = state.lock().map_err(|e| e.to_string())?;

    match runtime.handle.take() {
        Some(mut handle) => {
            handle.stop();
            runtime.bound_port = None;
            log::info!("OSC listener stopped");
            Ok(())
        }
        None => Err("OSC listener is not running".into()),
    }
}

/// Get the current OSC listener status.
#[tauri::command]
pub async fn get_osc_status(
    state: State<'_, Mutex<OscRuntime>>,
) -> Result<OscStatus, String> {
    let runtime = state.lock().map_err(|e| e.to_string())?;

    Ok(OscStatus {
        running: runtime.handle.as_ref().map_or(false, |h| h.is_active()),
        port: runtime.bound_port,
    })
}

#[derive(serde::Serialize)]
pub struct OscStatus {
    pub running: bool,
    pub port: Option<u16>,
}
