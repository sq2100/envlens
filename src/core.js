export function parseEnv(text) {
  const values = new Map(),
    lines = text
      .replace(/^\uFEFF/, "")
      .replace(/\r\n?/g, "\n")
      .split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(
      /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/,
    );
    if (!match)
      throw new Error(
        `Line ${i + 1}: expected KEY=value. Values are not included in this error.`,
      );
    const key = match[1],
      startLine = i + 1;
    let raw = match[2],
      value = "";
    if (values.has(key))
      throw new Error(`Duplicate key "${key}" at line ${startLine}.`);
    const quote = raw[0];
    if (quote === '"' || quote === "'") {
      let rest = raw.slice(1),
        closed = false;
      while (true) {
        for (let j = 0; j < rest.length; j++) {
          const c = rest[j];
          if (quote === '"' && c === "\\" && j + 1 < rest.length) {
            value += c + rest[++j];
            continue;
          }
          if (c === quote) {
            const tail = rest.slice(j + 1).trim();
            if (tail && !tail.startsWith("#"))
              throw new Error(
                `Line ${startLine}: unexpected text after a quoted value.`,
              );
            closed = true;
            break;
          }
          value += c;
        }
        if (closed) break;
        if (++i >= lines.length)
          throw new Error(`Line ${startLine}: unclosed quoted value.`);
        value += "\n";
        rest = lines[i];
      }
      if (quote === '"')
        value = value.replace(
          /\\([nrt"\\])/g,
          (_, c) => ({ n: "\n", r: "\r", t: "\t", '"': '"', "\\": "\\" })[c],
        );
    } else {
      if (quote === "`")
        throw new Error(
          `Line ${startLine}: backtick values are not supported.`,
        );
      value = raw.split("#")[0].trim();
    }
    values.set(key, value);
  }
  return values;
}
export function compareEnv(template, actual) {
  const rows = [];
  for (const [key] of template) {
    const status = !actual.has(key)
      ? "Missing"
      : actual.get(key).length === 0
        ? "Empty"
        : "Present";
    rows.push({ key, status });
  }
  for (const [key, value] of actual)
    if (!template.has(key))
      rows.push({
        key,
        status: value.length === 0 ? "Unexpected (empty)" : "Unexpected",
      });
  return rows;
}
export const exampleEnv = (template) =>
  [...template.keys()].map((key) => `${key}=`).join("\n") + "\n";
