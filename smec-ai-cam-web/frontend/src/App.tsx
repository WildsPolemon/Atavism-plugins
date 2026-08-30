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
  machiningTimeInitial: string;
  machiningTimeOptimized: string;
  saved: string;
  collisions: number;
  warnings: number;
  gcodeStatus: "VALID" | "INVALID";
  gcode: string;
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
          {loading ? "Submitting..." : "GENERATE CNC PROGRAM"}
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
            Saved: <strong>{job.finalProgram.saved}</strong> | Collisions:{" "}
            <strong>{job.finalProgram.collisions}</strong> | G-code:{" "}
            <strong>{job.finalProgram.gcodeStatus}</strong>
          </p>
          <p className="approval-note">
            Operator approval is required before running this NC file on a real machine.
          </p>
          <button type="button" onClick={downloadNc}>
            DOWNLOAD NC
          </button>
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
