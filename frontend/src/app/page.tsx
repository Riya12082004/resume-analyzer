"use client";

import { ChangeEvent, useState } from "react";

type AnalysisResult = {
  ats_score?: number;
  job_fit_score?: number;
  ml_score?: number;
  skill_match_score?: number;
  verdict?: string;
  jd_skills?: string[];
  resume_skills?: string[];
  matched_skills?: string[];
  missing_skills?: string[];
  recommendations?: string[];
  resume_words?: number;
  jd_words?: number;
  extracted_preview?: string;
  message?: string;
  error?: string;
};

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert("Please upload a resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      alert("Please paste the job description.");
      return;
    }

    if (jobDescription.trim().length < 50) {
      alert("Please enter a more complete job description.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("resume_file", selectedFile);
      formData.append("job_description", jobDescription);

      
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
console.log("API URL:", API_URL);

const response = await fetch(`${API_URL}/analyze`, {
  method: "POST",
  body: formData,
});
  
            const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      setResult({
        error: "Something went wrong while connecting to the backend.",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSkillBadges = (skills?: string[], color = "bg-slate-700") => {
    if (!skills || skills.length === 0) {
      return <span className="text-sm text-slate-300">None</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className={`rounded-full px-3 py-1 text-xs font-medium text-white ${color}`}
          >
            {skill}
          </span>
        ))}
      </div>
    );
  };

  const getScoreColor = (score?: number) => {
    if (!score && score !== 0) return "text-slate-200";
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-300";
    return "text-rose-400";
  };

  const getVerdictStyle = (verdict?: string) => {
    if (verdict === "Strong Match") {
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    }
    if (verdict === "Moderate Match") {
      return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
    }
    return "bg-rose-500/20 text-rose-300 border border-rose-500/30";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 py-12">
        <div className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-slate-300 backdrop-blur">
          AI-Powered Resume Screening
        </div>

        <h1 className="max-w-4xl text-center text-4xl font-bold leading-tight md:text-6xl">
          Resume Analyzer + Job Match Predictor
        </h1>

        <p className="mt-5 max-w-2xl text-center text-base text-slate-300 md:text-lg">
          Upload a resume, compare it with a job description, and get ATS-style
          scoring, missing skills, and job fit percentage in one clean dashboard.
        </p>

        <div className="mt-10 grid w-full gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <h2 className="mb-2 text-2xl font-semibold">Upload Resume</h2>
            <p className="mb-6 text-sm text-slate-300">
              Add a PDF resume and paste the job description.
            </p>

            <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-500 bg-slate-900/60 px-6 text-center transition hover:border-cyan-400 hover:bg-slate-900">
              <div className="mb-3 text-5xl">📄</div>
              <p className="text-lg font-medium">Drag & drop your resume here</p>
              <p className="mt-2 text-sm text-slate-400">
                or click to browse from your device
              </p>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <div className="mt-4 rounded-xl bg-slate-900/70 p-3 text-sm text-slate-300">
              {selectedFile ? (
                <span>
                  Selected file:{" "}
                  <span className="font-semibold text-cyan-400">
                    {selectedFile.name}
                  </span>
                </span>
              ) : (
                <span>No resume selected yet.</span>
              )}
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="min-h-[180px] w-full rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyzing..." : "Analyze Resume"}
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <h2 className="mb-4 text-2xl font-semibold">Analysis Result</h2>

            {result ? (
              result.error ? (
                <div className="rounded-2xl bg-red-900/40 p-4 text-sm text-red-200">
                  {result.error}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`rounded-2xl p-4 ${getVerdictStyle(result.verdict)}`}>
                    <p className="text-sm opacity-80">Overall Verdict</p>
                    <p className="mt-1 text-2xl font-bold">{result.verdict}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-900/70 p-4">
                      <p className="text-sm text-slate-400">Final ATS Score</p>
                      <p className={`mt-1 text-3xl font-bold ${getScoreColor(result.ats_score)}`}>
                        {result.ats_score}%
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-900/70 p-4">
                      <p className="text-sm text-slate-400">ML Score</p>
                      <p className={`mt-1 text-3xl font-bold ${getScoreColor(result.ml_score)}`}>
                        {result.ml_score}%
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-900/70 p-4">
                      <p className="text-sm text-slate-400">Skill Match</p>
                      <p className={`mt-1 text-3xl font-bold ${getScoreColor(result.skill_match_score)}`}>
                        {result.skill_match_score}%
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">Matched Skills</p>
                    <div className="mt-3">
                      {renderSkillBadges(result.matched_skills, "bg-emerald-600")}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">Missing Skills</p>
                    <div className="mt-3">
                      {renderSkillBadges(result.missing_skills, "bg-rose-700")}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-900/70 p-4">
                      <p className="text-sm text-slate-400">JD Skills</p>
                      <div className="mt-3">
                        {renderSkillBadges(result.jd_skills, "bg-blue-700")}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-900/70 p-4">
                      <p className="text-sm text-slate-400">Resume Skills</p>
                      <div className="mt-3">
                        {renderSkillBadges(result.resume_skills, "bg-violet-700")}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">Recommendations</p>
                    <div className="mt-3 space-y-2">
                      {result.recommendations?.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-xl bg-slate-800/80 p-3 text-sm text-slate-200"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-900/70 p-4">
                      <p className="text-sm text-slate-400">Resume Words</p>
                      <p className="mt-2 text-lg font-semibold text-slate-200">
                        {result.resume_words}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-900/70 p-4">
                      <p className="text-sm text-slate-400">JD Words</p>
                      <p className="mt-2 text-lg font-semibold text-slate-200">
                        {result.jd_words}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">Extracted Preview</p>
                    <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-slate-200">
                      {result.extracted_preview || "No text extracted."}
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="rounded-2xl bg-slate-900/70 p-4 text-sm text-slate-300">
                No analysis yet. Upload a PDF and click Analyze Resume.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}