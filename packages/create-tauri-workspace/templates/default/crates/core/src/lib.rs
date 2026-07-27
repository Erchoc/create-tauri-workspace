pub fn greeting(name: &str) -> String {
    let name = name.trim();
    if name.is_empty() {
        "Hello from Rust.".to_owned()
    } else {
        format!("Hello, {name}. Rust is connected.")
    }
}

#[cfg(test)]
mod tests {
    use super::greeting;

    #[test]
    fn greets_a_named_user() {
        assert_eq!(greeting("Tauri"), "Hello, Tauri. Rust is connected.");
    }
}
