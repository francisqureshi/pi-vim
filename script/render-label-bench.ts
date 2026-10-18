import { cpus } from "node:os";
import { performance } from "node:perf_hooks";
import { ModalEditor } from "../index.js";

type Args = ConstructorParameters<typeof ModalEditor>;
const style = process.argv[2];
const placement = process.argv[3] ?? "editor";
if (
  process.argv.length > 4 ||
  (style !== "full" && style !== "compact") ||
  (placement !== "editor" && placement !== "status")
) {
  console.error(
    "Usage: node --import tsx/esm script/render-label-bench.ts full|compact [editor|status]",
  );
  process.exitCode = 1;
} else {
  const samples = 7;
  const iterations = 100;
  const warmup = 100;
  const prompts = {
    short: "Hello 界 👩‍💻 e\u0301",
    long: "Review 界 👩‍💻 e\u0301 and explain the render output. ".repeat(40),
  };
  const results = [];
  let checksum = 0;
  for (const width of [20, 80, 120]) {
    for (const [prompt, text] of Object.entries(prompts)) {
      for (const ansi of [false, true]) {
        for (const mode of ["insert", "normal", "ex-hit", "ex-miss"]) {
          const paint = (s: string) => (ansi ? `\x1b[35m${s}\x1b[39m` : s);
          // The extra property is ignored by the pre-feature baseline. A named
          // options object lets this same harness compile against both versions.
          const options = {
            modeLabelStyle: style,
            modeLabelPlacement: placement,
            onModeLabel: (label: string) => {
              checksum += label.length;
            },
            labelColorizers: { insert: paint, normal: paint, ex: paint },
            borderColorizers: { insert: paint, normal: paint, ex: paint },
          };
          const editor = new ModalEditor(
            {
              requestRender() {},
              terminal: { rows: 40, columns: width },
            } as unknown as Args[0],
            {
              borderColor: paint,
              fg: (_k: string, s: string) => s,
              bold: (s: string) => s,
            } as unknown as Args[1],
            { matches: () => false } as unknown as Args[2],
            options as NonNullable<Args[3]>,
          );
          editor.setText(text);
          if (mode !== "insert") editor.handleInput("\x1b");
          if (mode.startsWith("ex")) {
            editor.handleInput(":");
            editor.handleInput("echo 界👩‍💻");
          }
          let tick = 0;
          const replay = () => {
            // Alternate a printable grapheme and backspace outside the timing
            // region: every EX miss render has a different pending label.
            if (mode === "ex-miss") {
              editor.handleInput(tick++ % 2 === 0 ? "x" : "\x7f");
            }
            const start = performance.now();
            const lines = editor.render(width);
            const elapsed = performance.now() - start;
            checksum += lines[lines.length - 1]?.length ?? 0;
            return elapsed;
          };
          for (let i = 0; i < warmup; i++) replay();
          const us = [];
          for (let sample = 0; sample < samples; sample++) {
            let elapsed = 0;
            for (let i = 0; i < iterations; i++) elapsed += replay();
            us.push((elapsed * 1000) / iterations);
          }
          const sorted = [...us].sort((a, b) => a - b);
          results.push({
            width,
            prompt,
            ansi,
            mode,
            medianUs: sorted[3],
            samplesUs: us,
          });
        }
      }
    }
  }
  console.log(
    JSON.stringify(
      {
        node: process.version,
        platform: `${process.platform}/${process.arch}`,
        cpu: cpus()[0]?.model,
        style,
        placement,
        warmup,
        samples,
        iterations,
        checksum,
        results,
      },
      null,
      2,
    ),
  );
}
