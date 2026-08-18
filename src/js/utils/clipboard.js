export async function readClipboardText() {
  return (await navigator.clipboard.readText()).trim();
}
