export const isTauriRuntime = (): boolean => {
  return (!!((window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) || false)
}