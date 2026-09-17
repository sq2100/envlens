import { parseEnv, compareEnv, exampleEnv } from "./core.js";
import {
  $,
  init,
  message,
  table,
  stats,
  csv,
  download,
  textImport,
  guard,
  ready,
} from "./ui.js";
init();
let rows = [],
  template;
function run() {
  template = parseEnv($("left").value);
  if (!template.size) throw new Error("The template needs at least one key.");
  rows = compareEnv(template, parseEnv($("right").value));
  stats([
    ["Missing", rows.filter((r) => r.status === "Missing").length],
    ["Empty required keys", rows.filter((r) => r.status === "Empty").length],
    ["Present", rows.filter((r) => r.status === "Present").length],
    [
      "Unexpected",
      rows.filter((r) => r.status.startsWith("Unexpected")).length,
    ],
  ]);
  table(
    ["Key", "Status"],
    rows.map((r) => [r.key, r.status]),
  );
  message(
    "Reports contain key names and status only. Values have not been included.",
  );
  ready();
}
$("run").onclick = guard(run);
for (const side of ["left", "right"])
  textImport(`file-${side}`, side, () =>
    document
      .querySelectorAll("[data-export]")
      .forEach((b) => (b.disabled = true)),
  );
$("export").onclick = () =>
  download(
    csv([["key", "status"], ...rows.map((r) => [r.key, r.status])]),
    "envlens-report.csv",
    "text/csv;charset=utf-8",
  );
$("example").onclick = () => download(exampleEnv(template), ".env.example");
$("demo").onclick = guard(() => {
  $("left").value =
    "# Required by the project\nAPP_NAME=\nDATABASE_URL=\nMAIL_FROM=\nLOG_LEVEL=\nFEATURE_SEARCH=";
  $("right").value =
    '# Fictional example only\nAPP_NAME=weekend\nDATABASE_URL="demo-value-not-a-real-credential"\nMAIL_FROM=\nLOG_LEVEL=info\nOLD_SETTING=unused';
  run();
});
