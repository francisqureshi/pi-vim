import { cpus } from "node:os";
import { performance } from "node:perf_hooks";
import { ModalEditor } from "../index.js";

type Args = ConstructorParameters<typeof ModalEditor>;
const style = process.argv[2];
const placement = process.argv[3];
if (
  process.argv.length !== 4 ||
  (style !== "full" && style !== "compact") ||
  (placement !== "editor" && placement !== "status")
) {
  console.error(
    "Usage: node --import tsx/esm script/mode-label-input-bench.ts full|compact editor|status",
  );
  process.exitCode = 1;
} else {
  const samples = 5;
  const cycles = 40;
  const warmup = 20;
  const fixtures = [
    { name: "insert", setup: [], keys: ["x", "\x7f"] },
    { name: "normal", setup: ["\x1b"], keys: ["h", "l"] },
    {
      name: "counts",
      setup: ["\x1b"],
      keys: ["2", "d", "3", "f", "\x1b"],
    },
    {
      name: "long-ex",
      setup: ["\x1b", ":", "echo e\u0301界👩‍💻 ".repeat(40)],
      keys: ["👩‍💻", "\x7f"],
    },
  ];
  const median = (values: number[]) =>
    [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const results = [];
  for (const width of [12, 80]) {
    for (const fixture of fixtures) {
      let checksum = 2166136261;
      let statusCalls = 0;
      const observe = (text: string) => {
        for (let i = 0; i < text.length; i++) {
          checksum = Math.imul(checksum ^ text.charCodeAt(i), 16777619) >>> 0;
        }
      };
      const paint = (text: string) => `\x1b[35m${text}\x1b[39m`;
      const label = (text: string) => paint(`\x1b[7m${text}\x1b[27m`);
      // The frozen upstream ignores the new options; use identical fixtures.
      const options = {
        modeLabelStyle: style,
        modeLabelPlacement: placement,
        onModeLabel: (text: string) => {
          statusCalls++;
          observe(text);
        },
        labelColorizers: { insert: label, normal: label, ex: label },
        borderColorizers: { insert: paint, normal: paint, ex: paint },
      };
      const editor = new ModalEditor(
        {
          requestRender() {},
          terminal: { rows: 40, columns: width },
        } as unknown as Args[0],
        {
          borderColor: paint,
          fg: (_token: string, text: string) => text,
          bold: (text: string) => text,
        } as unknown as Args[1],
        { matches: () => false } as unknown as Args[2],
        options as NonNullable<Args[3]>,
      );
      editor.setText("Hello 界 👩‍💻 e\u0301 draft");
      for (const key of fixture.setup) editor.handleInput(key);
      editor.render(width);
      const replay = () => {
        let inputMs = 0;
        let renderMs = 0;
        for (const key of fixture.keys) {
          const start = performance.now();
          editor.handleInput(key);
          const afterInput = performance.now();
          const lines = editor.render(width);
          const afterRender = performance.now();
          inputMs += afterInput - start;
          renderMs += afterRender - afterInput;
          // Output observation is outside timing; status callback work is inside.
          for (const line of lines) observe(line);
        }
        observe(editor.getText());
        observe(JSON.stringify(editor.getCursor()));
        observe(editor.getMode());
        return { inputMs, renderMs };
      };
      for (let i = 0; i < warmup; i++) replay();
      const inputUs = [];
      const renderUs = [];
      const totalUs = [];
      for (let sample = 0; sample < samples; sample++) {
        let inputMs = 0;
        let renderMs = 0;
        for (let i = 0; i < cycles; i++) {
          const timing = replay();
          inputMs += timing.inputMs;
          renderMs += timing.renderMs;
        }
        const scale = 1000 / (cycles * fixture.keys.length);
        inputUs.push(inputMs * scale);
        renderUs.push(renderMs * scale);
        totalUs.push((inputMs + renderMs) * scale);
      }
      results.push({
        width,
        fixture: fixture.name,
        medianInputUs: median(inputUs),
        medianRenderUs: median(renderUs),
        medianTotalUs: median(totalUs),
        inputUs,
        renderUs,
        totalUs,
        statusCalls,
        checksum,
      });
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
        samples,
        cycles,
        warmup,
        results,
      },
      null,
      2,
    ),
  );
}
