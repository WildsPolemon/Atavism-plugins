import type { OperationPlan } from "./types.js";

function operationComment(op: OperationPlan): string {
  return `${op.name} | TOOL ${op.tool} | VC ${op.cuttingSpeed} m/min`;
}

export function buildFanucProgram(operations: OperationPlan[], stockDiameter: number): string {
  const lines: string[] = [
    "%",
    "O1001",
    "(SMEC LATHE / FANUC AUTO CNC)",
    "(SAFETY START BLOCK)",
    "G18 G21 G40 G80 G97 G99",
    `G50 S3500`,
    "G28 U0 W0",
    "M08",
    ""
  ];

  let safeX = stockDiameter + 8;
  let safeZ = 3;
  for (const op of operations) {
    lines.push(`(${operationComment(op)})`);
    lines.push(op.toolId);
    lines.push(`G97 S${op.rpm} M03`);
    lines.push(`G00 X${safeX.toFixed(3)} Z${safeZ.toFixed(3)}`);

    if (op.type === "threading") {
      const threadDepthMicron = Math.max(120, Math.round(op.doc * 1000));
      const firstPassMicron = Math.max(80, Math.round((op.doc * 0.6) * 1000));
      const minorDia = Math.max(0.8, stockDiameter - 4.0);
      lines.push("G76 P010060 Q100 R0.03");
      lines.push(
        `G76 X${minorDia.toFixed(3)} Z-${(stockDiameter * 0.6).toFixed(3)} R0.000 P${threadDepthMicron} Q${firstPassMicron} F${op.feedPerRev.toFixed(3)}`
      );
    } else {
      lines.push(`G01 Z0.000 F${op.feedPerRev.toFixed(3)}`);
      lines.push(`(DOC ${op.doc.toFixed(3)} / PASSES ${op.passes})`);
      lines.push(`G01 X${Math.max(0.5, stockDiameter - op.doc * 2).toFixed(3)} F${op.feedPerRev.toFixed(3)}`);
    }

    safeX += 2;
    safeZ += 1;
    lines.push(`G00 X${safeX.toFixed(3)} Z${safeZ.toFixed(3)}`);
    lines.push("");
  }

  lines.push("M09");
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
  if (!lines.some((line) => line.includes("G18"))) {
    errors.push("Lathe plane G18 is required in safety block.");
  }
  if (!lines.some((line) => line.includes("G50 S"))) {
    errors.push("Spindle clamp G50 is required for FANUC safety.");
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
    if (line.startsWith("G00 X")) {
      const xValue = Number(line.replace("G00 X", "").split(" ")[0]);
      if (Number.isFinite(xValue) && xValue <= 0) {
        errors.push(`Unsafe rapid X move: ${line}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
