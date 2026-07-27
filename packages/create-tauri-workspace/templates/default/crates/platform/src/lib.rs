#[derive(Debug, Clone, Copy)]
pub struct Platform {
    pub os: &'static str,
    pub architecture: &'static str,
}

pub fn current() -> Platform {
    Platform {
        os: std::env::consts::OS,
        architecture: std::env::consts::ARCH,
    }
}
