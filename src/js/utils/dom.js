export function resolveTarget(target) {
  if (typeof target === "string") {
    return document.getElementById(target);
  }

  if (target instanceof Element) {
    return target;
  }

  return null;
}
