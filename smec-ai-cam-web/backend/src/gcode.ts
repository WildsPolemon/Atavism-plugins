import type { OperationPlan } from "./types.js";

export function buildFanucProgram(operations: OperationPlan[]): string {
  const lines: string[] = [
    "%",
    "O1001",
    "",
    "G21",
    "G40",
    "G99",
    "",
    "G28 U0 W0",
    ""
  ];

  for (const [idx, op] of operations.entries()) {
    lines.push(`(${idx + 1}. ${op.name})`);
    lines.push(`T0${idx + 1}0${idx + 1}`);
    lines.push(`G97 S${op.rpm} M03`);
    lines.push("G00 X62.0 Z2.0");
    lines.push(`G01 Z0.0 F${op.feedPerRev.toFixed(2)}`);
    lines.push(`(DOC ${op.doc.toFixed(2)} / PASSES ${op.passes})`);
    lines.push("G00 X80.0 Z10.0");
    lines.push("");
  }

  lines.push("M05");
  lines.push("G28 U0 W0");
  lines.push("M30");
  lines.push("%");
  return lines.join("\n");
}

export interface GcodeValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateFanucProgram(
  gcode: string,
  maxRpm = 3500,
  minFeed = 0.02
): GcodeValidationResult {
  const lines = gcode.split("\n").map((line) => line.trim());
  const errors: string[] = [];

  if (!lines[0]?.startsWith("%") || !lines.at(-1)?.startsWith("%")) {
    errors.push("Program must start and end with %.");
  }
  if (!lines.some((line) => line.startsWith("O"))) {
    errors.push("Program number Oxxxx is missing.");
  }
  if (!lines.includes("M30")) {
    errors.push("Program end M30 is missing.");
  }

  for (const line of lines) {
    if (line.startsWith("G97 S")) {
      const value = Number(line.replace("G97 S", "").split(" ")[0]);
      if (Number.isFinite(value) && value > maxRpm) {
        errors.push(`RPM exceeds machine limit: ${value} > ${maxRpm}`);
      }
    }
    if (line.startsWith("G01") && line.includes("F")) {
      const feed = Number(line.split("F")[1]);
      if (Number.isFinite(feed) && feed < minFeed) {
        errors.push(`Feed is too low for stable cutting: ${feed}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
