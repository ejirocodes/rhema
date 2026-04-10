pub mod coerce;
pub mod command;
pub mod dispatch;
pub mod error;
pub mod osc;

pub use coerce::{coerce_bool, coerce_f32_normalized, coerce_string, parse_osc};
pub use command::RemoteCommand;
pub use dispatch::{CommandDispatcher, CommandSink};
pub use error::CommandError;
pub use osc::{start_osc_listener, OscConfig, OscHandle, OscStartResult};
