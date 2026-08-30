import { useEffect, useMemo, useState } from "react";
import "./App.css";

type StepState = "pending" | "running" | "done" | "failed";

interface Step {
  id: string;
  label: string;
  state: StepState;
  details?: string;
}

interface Recommendation {
  title: string;
  reason: string;
  impact: string;
}

interface Operation {
  name: string;
  tool: string;
  rpm: number;
  feedPerRev: number;
  doc: number;
  passes: number;
}

interface MissingTool {
  operationType: string;
  operationName: string;
  recommendedLabel: string;
}

interface ToolPayload {
  id: string;
  station: string;
  label: string;
  operationTypes: string[];
  minDiameter: number;
  maxDiameter: number;
  maxDoc: number;
  noseRadius: number;
  available: boolean;
}

interface SimulationCheck {
  label: string;
  passed: boolean;
  details: string;
}

interface Feature {
  name: string;
  value: string;
}

interface FinalProgram {
  machine: string;
  controller: string;
  material: string;
  operations: number;
  tools: number;
  stock: string;
  quantity: number;
  machiningTimeInitial: string;
  machiningTimeOptimized: string;
  saved: string;
  collisions: number;
  warnings: number;
  gcodeStatus: "VALID" | "INVALID";
  gcode: string;
  simulationReport: {
    checks: SimulationCheck[];
    iterations: number;
    stable: boolean;
  };
  operatorApproved: boolean;
}

interface JobState {
  id: string;
  status: string;
  progressPercent: number;
  steps: Step[];
  detectedFeatures: Feature[];
  operations: Operation[];
  recommendations: Recommendation[];
  finalProgram?: FinalProgram;
  warnings: string[];
  errors: string[];
  missingTools: MissingTool[];
}

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

function App() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [machine, setMachine] = useState("SMEC + FANUC");
  const [material, setMaterial] = useState("Steel 45");
  const [stock, setStock] = useState("Ø60 × 100 mm");
  const [quantity, setQuantity] = useState(10);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [operationOrder, setOperationOrder] = useState(
    "Facing, Rough Turning, Finish Turning, Grooving, Threading, Parting"
  );
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobState | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingTool, setAddingTool] = useState(false);
  const [show3d, setShow3d] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFinal = job?.status === "completed" || job?.status === "manual_review_required";

  useEffect(() => {
    if (!jobId) {
      return;
    }
    const timer = window.setInterval(async () => {
      const response = await fetch(`${apiBase}/api/auto-cnc/jobs/${jobId}`);
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as JobState;
      setJob(data);
      if (data.status === "completed" || data.status === "manual_review_required") {
        window.clearInterval(timer);
      }
    }, 900);

    return () => window.clearInterval(timer);
  }, [jobId]);

  const sortedSteps = useMemo(() => job?.steps ?? [], [job]);

  async function onGenerate(): Promise<void> {
    setError(null);
    if (!files || files.length === 0) {
      setError("Upload at least one drawing file.");
      return;
    }
    setLoading(true);

    const body = new FormData();
    Array.from(files).forEach((file) => body.append("files", file));
    body.append("machine", machine);
    body.append("material", material);
    body.append("stock", stock);
    body.append("quantity", String(quantity));
    body.append("advancedMode", String(advancedMode));
    if (advancedMode) {
      body.append("operationOrder", operationOrder);
    }

    const response = await fetch(`${apiBase}/api/auto-cnc/jobs`, {
      method: "POST",
      body
    });
    setLoading(false);

    if (!response.ok) {
      setError("Generation request failed.");
      return;
    }
    const data = (await response.json()) as { jobId: string };
    setJobId(data.jobId);
  }

  function suggestedToolFor(operationType: string, label: string): ToolPayload {
    if (operationType === "grooving") {
      return {
        id: "T0909",
        station: "T0909",
        label,
        operationTypes: ["grooving"],
        minDiameter: 6,
        maxDiameter: 120,
        maxDoc: 2,
        noseRadius: 0.2,
        available: true
      };
    }
    if (operationType === "threading") {
      return {
        id: "T0808",
        station: "T0808",
        label,
        operationTypes: ["threading"],
        minDiameter: 10,
        maxDiameter: 120,
        maxDoc: 0.5,
        noseRadius: 0.2,
        available: true
      };
    }
    return {
      id: "T0707",
      station: "T0707",
      label,
      operationTypes: [operationType],
      minDiameter: 0,
      maxDiameter: 200,
      maxDoc: 3,
      noseRadius: 0.4,
      available: true
    };
  }

  async function addMissingToolsAndRetry(): Promise<void> {
    if (!jobId || !job || job.missingTools.length === 0) {
      return;
    }
    setAddingTool(true);
    for (const missing of job.missingTools) {
      const payload = suggestedToolFor(missing.operationType, missing.recommendedLabel);
      await fetch(`${apiBase}/api/tools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }
    await fetch(`${apiBase}/api/auto-cnc/jobs/${jobId}/retry`, { method: "POST" });
    setAddingTool(false);
  }

  async function setOperatorApproval(approve: boolean): Promise<void> {
    if (!jobId) {
      return;
    }
    setApprovalBusy(true);
    await fetch(`${apiBase}/api/auto-cnc/jobs/${jobId}/operator-approval`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approve })
    });
    const updated = await fetch(`${apiBase}/api/auto-cnc/jobs/${jobId}`);
    if (updated.ok) {
      const data = (await updated.json()) as JobState;
      setJob(data);
    }
    setApprovalBusy(false);
  }

  function downloadNc(): void {
    if (!job?.finalProgram?.gcode) {
      return;
    }
    const blob = new Blob([job.finalProgram.gcode], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "PROGRAM.NC";
    anchor.click();
    URL.revokeObjectURL(href);
  }

  return (
    <main className="layout">
      <section className="hero">
        <p className="eyebrow">SMEC AI CAM</p>
        <h1>AUTO CNC</h1>
        <p className="subtitle">Upload drawing and automatically create a FANUC CNC program.</p>
      </section>

      <section className="card">
        <h2>1. Input</h2>
        <div className="form-grid">
          <label>
            Drawing files (photo / PDF / DXF / STEP)
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.dxf,.step,.stp"
              onChange={(event) => setFiles(event.target.files)}
            />
          </label>
          <label>
            Machine
            <select value={machine} onChange={(event) => setMachine(event.target.value)}>
              <option>SMEC + FANUC</option>
            </select>
          </label>
          <label>
            Material
            <input value={material} onChange={(event) => setMaterial(event.target.value)} />
          </label>
          <label>
            Stock
            <input value={stock} onChange={(event) => setStock(event.target.value)} />
          </label>
          <label>
            Quantity
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </label>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={advancedMode}
            onChange={(event) => setAdvancedMode(event.target.checked)}
          />
          <span>Advanced Mode (manual overrides)</span>
        </label>
        {advancedMode && (
          <label>
            Operation order (comma-separated)
            <input
              value={operationOrder}
              onChange={(event) => setOperationOrder(event.target.value)}
            />
          </label>
        )}

        <button className="primary-btn" type="button" onClick={onGenerate} disabled={loading}>
          {loading ? "Submitting..." : "AUTO CNC"}
        </button>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        <h2>2. AUTO CNC GENERATION</h2>
        <p className="progress-number">{job?.progressPercent ?? 0}%</p>
        <ul className="progress-list">
          {sortedSteps.map((step) => (
            <li key={step.id} className={`step ${step.state}`}>
              <span>{step.state === "done" ? "✓" : step.state === "failed" ? "⚠" : "•"}</span>
              <div>
                <strong>{step.label}</strong>
                {step.details && <p>{step.details}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {job && (
        <section className="grid-2">
          <article className="card">
            <h3>Detected Features</h3>
            <ul>
              {job.detectedFeatures.map((item, index) => (
                <li key={`${item.name}-${index}`}>
                  {item.name}: <strong>{item.value}</strong>
                </li>
              ))}
            </ul>
          </article>
          <article className="card">
            <h3>AI Recommendations</h3>
            {job.recommendations.map((rec) => (
              <div key={rec.title} className="recommendation">
                <strong>{rec.title}</strong>
                <p>{rec.reason}</p>
                <small>{rec.impact}</small>
              </div>
            ))}
            {job.warnings.length > 0 && (
              <>
                <h4>Warnings</h4>
                <ul>
                  {job.warnings.map((warning, idx) => (
                    <li key={`${warning}-${idx}`}>{warning}</li>
                  ))}
                </ul>
              </>
            )}
            {job.missingTools.length > 0 && (
              <>
                <h4>TOOL REQUIRED</h4>
                <ul>
                  {job.missingTools.map((tool, idx) => (
                    <li key={`${tool.operationType}-${idx}`}>
                      {tool.operationName}: {tool.recommendedLabel}
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={addMissingToolsAndRetry} disabled={addingTool}>
                  {addingTool ? "Adding tools..." : "ADD TOOL & RETRY AUTO CNC"}
                </button>
              </>
            )}
          </article>
        </section>
      )}

      {job?.operations?.length ? (
        <section className="card">
          <h3>Operation Plan</h3>
          <table>
            <thead>
              <tr>
                <th>Operation</th>
                <th>Tool</th>
                <th>RPM</th>
                <th>Feed/rev</th>
                <th>DOC</th>
                <th>Passes</th>
              </tr>
            </thead>
            <tbody>
              {job.operations.map((op) => (
                <tr key={op.name}>
                  <td>{op.name}</td>
                  <td>{op.tool}</td>
                  <td>{op.rpm}</td>
                  <td>{op.feedPerRev}</td>
                  <td>{op.doc}</td>
                  <td>{op.passes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {isFinal && job.finalProgram && (
        <section className="card result">
          <h2>CNC PROGRAM READY</h2>
          <p>
            Machine: <strong>{job.finalProgram.machine}</strong> | Controller:{" "}
            <strong>{job.finalProgram.controller}</strong> | Material:{" "}
            <strong>{job.finalProgram.material}</strong>
          </p>
          <p>
            Operations: <strong>{job.finalProgram.operations}</strong> | Tools:{" "}
            <strong>{job.finalProgram.tools}</strong> | Optimized Time:{" "}
            <strong>{job.finalProgram.machiningTimeOptimized}</strong>
          </p>
          <p>
            Stock: <strong>{job.finalProgram.stock}</strong> | Quantity:{" "}
            <strong>{job.finalProgram.quantity}</strong>
          </p>
          <p>
            Saved: <strong>{job.finalProgram.saved}</strong> | Collisions:{" "}
            <strong>{job.finalProgram.collisions}</strong> | G-code:{" "}
            <strong>{job.finalProgram.gcodeStatus}</strong>
          </p>
          <p>
            Optimization iterations: <strong>{job.finalProgram.simulationReport.iterations}</strong> | Stable:{" "}
            <strong>{job.finalProgram.simulationReport.stable ? "YES" : "NO"}</strong>
          </p>
          <p className="approval-note">
            Operator approval is required before running this NC file on a real machine.
          </p>
          <div className="row-actions">
            <button
              type="button"
              onClick={() => setOperatorApproval(true)}
              disabled={approvalBusy || job.finalProgram.operatorApproved}
            >
              {job.finalProgram.operatorApproved ? "OPERATOR APPROVED" : "APPROVE PROGRAM"}
            </button>
            <button
              type="button"
              onClick={() => setOperatorApproval(false)}
              disabled={approvalBusy || !job.finalProgram.operatorApproved}
            >
              REVOKE APPROVAL
            </button>
          </div>
          <button type="button" onClick={() => setShow3d((current) => !current)}>
            {show3d ? "HIDE 3D" : "VIEW 3D"}
          </button>
          {show3d && (
            <div className="model3d">
              <svg viewBox="0 0 540 180" role="img" aria-label="lathe part preview">
                <polyline
                  points="20,120 60,120 80,95 130,95 150,75 220,75 250,88 310,88 330,70 400,70 430,90 520,90"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="6"
                />
                <polyline
                  points="20,60 60,60 80,85 130,85 150,105 220,105 250,92 310,92 330,110 400,110 430,90 520,90"
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth="6"
                />
                <text x="20" y="20" fill="#0f172a">
                  3D stock/part preview (auto-reconstructed profile)
                </text>
              </svg>
            </div>
          )}
          <button type="button" onClick={downloadNc}>
            DOWNLOAD NC
          </button>
          <details>
            <summary>SIMULATION & VALIDATION REPORT</summary>
            <ul>
              {job.finalProgram.simulationReport.checks.map((check, idx) => (
                <li key={`${check.label}-${idx}`}>
                  {check.passed ? "✓" : "⚠"} {check.label}: {check.details}
                </li>
              ))}
            </ul>
          </details>
          <details>
            <summary>VIEW G-CODE</summary>
            <pre>{job.finalProgram.gcode}</pre>
          </details>
        </section>
      )}
    </main>
  );
}

export default App;
