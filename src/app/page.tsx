"use client";

import { useEffect, useRef, useState } from "react";

type AnalysisResult = {
  main_subject: string;
  secondary_elements: string;
  environment: string;
  lighting: string;
  camera_angle: string;
  depth_of_field: string;
  texture_details: string;
  mood: string;
  color_grading: string;
  style_reference: string;
  full_prompt: string;
  quality_tags: string;
};

type HistoryItem = {
  id: number;
  createdAt: string;
  aspectRatio: string;
  fullPrompt: string;
  thumbnail: string | null;
};

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9", "2:3", "3:2"];

export default function HomePage() {
  const [mode, setMode] = useState<"image" | "enhance">("image");
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [provider, setProvider] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showJson, setShowJson] = useState(false);
  const [enhanceInput, setEnhanceInput] = useState("");
  const [enhanced, setEnhanced] = useState("");
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (Array.isArray(data.items)) setHistory(data.items);
    } catch {}
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setFileName(file.name);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const analyze = async () => {
    if (!image) {
      setError("Upload an image first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, aspectRatio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Analysis failed");
      setResult(data.result);
      setProvider(data.provider);
      loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.full_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadPrompt = () => {
    if (!result) return;
    const json = JSON.stringify(result, null, 2);
    const content = `---ENGLISH PROMPT---\n${result.full_prompt}\n\n---JSON OUTPUT---\n${json}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "image-to-prompt.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "image-to-prompt.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJson = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const enhance = async () => {
    if (!enhanceInput.trim()) return;
    setEnhanceLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: enhanceInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Enhance failed");
      setEnhanced(data.enhanced);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enhance failed");
    } finally {
      setEnhanceLoading(false);
    }
  };

  const removeHistory = async (id: number) => {
    await fetch(`/api/history?id=${id}`, { method: "DELETE" });
    loadHistory();
  };

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#">
            <span className="brand-mark">IP</span>
            Image To Promt
          </a>
          <nav className="nav-links">
            <a href="#workspace">Workspace</a>
            <a href="#history">History</a>
            <span className="nav-status">
              <span className="status-dot" />
              Online
            </span>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <span className="eyebrow">
            <span className="eyebrow-icon">✦</span>
            Premium Prompt Engine
          </span>
          <h1>
            Turn any image into a <span>perfect prompt</span>
          </h1>
          <p className="hero-copy">
            Deep visual analysis transformed into professional, copy-ready prompts for Midjourney, DALL-E and Stable Diffusion.
          </p>
        </section>

        <section className="workspace" id="workspace">
          <div className="panel">
            <div className="panel-top">
              <div className="panel-title">
                <span className="step-number">1</span>
                {mode === "image" ? "Image to Prompt" : "Prompt Enhancer"}
              </div>
              <span className="file-hint">
                {mode === "image" ? "Upload one image" : "Paste a rough prompt"}
              </span>
            </div>

            <div className="mode-tabs">
              <button
                className={`mode-tab ${mode === "image" ? "active" : ""}`}
                onClick={() => setMode("image")}
              >
                Image → Prompt
              </button>
              <button
                className={`mode-tab ${mode === "enhance" ? "active" : ""}`}
                onClick={() => setMode("enhance")}
              >
                Enhance Prompt
              </button>
            </div>

            {mode === "image" && (
              <>
                <div
                  className="dropzone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="upload-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
                    </svg>
                  </div>
                  <p className="drop-title">Drop image here</p>
                  <p className="drop-copy">or click to browse. PNG, JPG, WEBP supported.</p>
                  <span className="select-button">Select Image</span>
                  <input
                    ref={fileInputRef}
                    className="file-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                  <span className="format-note">{fileName || "No file selected"}</span>
                </div>

                {image && <img className="preview-img" src={image} alt="preview" />}

                <div className="aspect-row">
                  <span>Aspect ratio:</span>
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                    {ASPECT_RATIOS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <span style={{ marginLeft: "auto" }}>Target output ratio</span>
                </div>

                <div className="panel-actions">
                  <button className="primary-button" onClick={analyze} disabled={loading || !image}>
                    {loading ? <span className="spinner" /> : null}
                    {loading ? "Analyzing…" : "Generate Prompt"}
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setImage(null);
                      setFileName("");
                      setResult(null);
                      setError(null);
                    }}
                  >
                    Reset
                  </button>
                  <span className="action-caption">Deep visual analysis</span>
                </div>
              </>
            )}

            {mode === "enhance" && (
              <>
                <textarea
                  className="textarea"
                  placeholder="Paste a rough prompt to enhance…"
                  value={enhanceInput}
                  onChange={(e) => setEnhanceInput(e.target.value)}
                />
                <div className="panel-actions">
                  <button className="primary-button" onClick={enhance} disabled={enhanceLoading || !enhanceInput.trim()}>
                    {enhanceLoading ? <span className="spinner" /> : null}
                    {enhanceLoading ? "Enhancing…" : "Enhance"}
                  </button>
                  <button className="secondary-button" onClick={() => { setEnhanceInput(""); setEnhanced(""); }}>
                    Reset
                  </button>
                  <span className="action-caption">AI prompt refinement</span>
                </div>
                {enhanced && (
                  <div className="result">
                    <div className="result-head">
                      <span className="result-label">Enhanced Prompt</span>
                      <span className="result-meta">copy-ready</span>
                    </div>
                    <p className="prompt-text">{enhanced}</p>
                    <div className="panel-actions" style={{ borderTop: "none", paddingTop: 0 }}>
                      <button className="secondary-button" onClick={() => navigator.clipboard.writeText(enhanced)}>
                        Copy
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() => {
                          const blob = new Blob([enhanced], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "enhanced-prompt.txt";
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {error && <div className="error-box">{error}</div>}

            {result && mode === "image" && (
              <>
                <div className="result">
                  <div className="result-head">
                    <span className="result-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 6h16M4 12h16M4 18h10" />
                      </svg>
                      English Prompt
                    </span>
                    <span className="result-meta">{provider ? `via ${provider}` : ""}</span>
                  </div>
                  <p className="prompt-text">{result.full_prompt}</p>
                </div>

                <div className="result">
                  <div className="result-head">
                    <span className="result-label">JSON Output</span>
                    <span className="result-meta">
                      <button
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#83837d", fontSize: 9 }}
                        onClick={() => setShowJson((v) => !v)}
                      >
                        {showJson ? "hide" : "show"}
                      </button>
                    </span>
                  </div>
                  {showJson && <pre className="json-block">{JSON.stringify(result, null, 2)}</pre>}
                </div>

                <div className="panel-actions">
                  <button className="primary-button" onClick={copyPrompt}>
                    {copied ? "Copied!" : "Copy Prompt"}
                  </button>
                  <button className="secondary-button" onClick={downloadPrompt}>
                    Download TXT
                  </button>
                  <button className="secondary-button" onClick={downloadJson}>
                    Download JSON
                  </button>
                  <button className="secondary-button" onClick={copyJson}>
                    Copy JSON
                  </button>
                </div>

                <div className="sample-row">
                  <span className="sample-rule" />
                  <span className="sample-chip">
                    <span>AR</span>
                    {aspectRatio}
                  </span>
                  <span className="sample-chip">
                    <span>Q</span>
                    {result.quality_tags.split(",")[0]}
                  </span>
                  <span className="sample-rule" />
                </div>
              </>
            )}
          </div>
        </section>

        <section className="workspace" id="history">
          <div className="panel">
            <div className="panel-top">
              <div className="panel-title">
                <span className="step-number">2</span>
                History
              </div>
              <span className="file-hint">Recent generations</span>
            </div>
            <div className="history-list">
              {history.length === 0 && (
                <div className="error-box" style={{ background: "#fafaf9", borderColor: "#e7e7e4", color: "#777772" }}>
                  No generations yet.
                </div>
              )}
              {history.map((h) => (
                <div className="history-item" key={h.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontWeight: 650 }}>#{h.id} · {h.aspectRatio}</span>
                    <button
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#8a2a2a", fontSize: 9 }}
                      onClick={() => removeHistory(h.id)}
                    >
                      delete
                    </button>
                  </div>
                  <div className="hprompt">{h.fullPrompt}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-inner">
          <span className="footer-brand">Image To Promt</span>
          <span className="footer-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            Premium prompt generation
          </span>
        </div>
      </footer>
    </>
  );
}