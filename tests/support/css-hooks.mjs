// Node module hooks for unit tests: CSS imports become plain objects (class name = key).
export async function load(url, context, nextLoad) {
  if (url.endsWith(".css")) {
    return {
      format: "module",
      shortCircuit: true,
      source: url.endsWith(".module.css")
        ? "export default new Proxy({}, { get: (_, key) => String(key) });"
        : "export default {};",
    };
  }
  return nextLoad(url, context);
}
