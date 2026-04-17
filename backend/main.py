from io import BytesIO
import re
import joblib
import pdfplumber
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from scipy.sparse import hstack, csr_matrix

print("LATEST BACKEND DEPLOY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://resume-analyzer-coral-two.vercel.app",
        "https://resume-analyzer-git-main-riya12082004s-projects.vercel.app",
        "https://resume-analyzer-idpta1nn-riya12082004s-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

SKILL_KEYWORDS = [
    "python",
    "sql",
    "excel",
    "power bi",
    "tableau",
    "statistics",
    "machine learning",
    "deep learning",
    "nlp",
    "data analysis",
    "data visualization",
    "pandas",
    "numpy",
    "scikit-learn",
    "fastapi",
    "tensorflow",
    "keras",
    "pytorch",
    "communication",
    "problem solving",
    "critical thinking",
    "dashboard",
    "reporting",
    "etl",
    "data cleaning",
    "data mining",
    "business analysis",
]


def extract_pdf_text(file_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def find_skills(text: str, skill_list: list[str]) -> list[str]:
    text = normalize_text(text)
    found = []

    for skill in skill_list:
        if skill.lower() in text:
            found.append(skill)

    return sorted(list(set(found)))


def calculate_skill_match_score(jd_skills: list[str], resume_skills: list[str]) -> int:
    if not jd_skills:
        return 0
    matched_count = len(set(jd_skills) & set(resume_skills))
    return round((matched_count / len(jd_skills)) * 100)


def get_verdict(score: int) -> str:
    if score >= 80:
        return "Strong Match"
    if score >= 60:
        return "Moderate Match"
    return "Low Match"


def get_recommendations(missing_skills: list[str], final_score: int) -> list[str]:
    recommendations = []

    if missing_skills:
        recommendations.append(
            f"Add or highlight these missing skills: {', '.join(missing_skills[:5])}."
        )

    if final_score < 60:
        recommendations.append(
            "Improve the resume by adding more role-relevant projects, tools, and measurable achievements."
        )

    recommendations.append(
        "Tailor the resume summary and project descriptions to match the language of the job description."
    )

    recommendations.append(
        "Quantify impact wherever possible, such as dashboards built, models developed, or business outcomes improved."
    )

    return recommendations[:3]


@app.get("/")
def read_root():
    return {"message": "Backend is working"}


@app.post("/analyze")
async def analyze_resume(
    job_description: str = Form(...),
    resume_file: UploadFile = File(...),
):
    try:
        file_bytes = await resume_file.read()

        if not resume_file.filename or not resume_file.filename.lower().endswith(".pdf"):
            return {"error": "Only PDF files supported"}

        resume_text = extract_pdf_text(file_bytes)
        combined_text = resume_text + " [SEP] " + job_description

        resume_word_count = len(resume_text.split())
        jd_word_count = len(job_description.split())
        resume_char_count = len(resume_text)
        jd_char_count = len(job_description)

        X_text = vectorizer.transform([combined_text])
        X_num = csr_matrix([[resume_word_count, jd_word_count, resume_char_count, jd_char_count]])
        X = hstack([X_text, X_num]).toarray()

        ml_prediction = model.predict(X)[0]
        ml_prediction = max(0, min(1, ml_prediction))
        ml_score = round(ml_prediction * 100)

        jd_skills = find_skills(job_description, SKILL_KEYWORDS)
        resume_skills = find_skills(resume_text, SKILL_KEYWORDS)

        matched_skills = sorted(list(set(jd_skills) & set(resume_skills)))
        missing_skills = sorted(list(set(jd_skills) - set(resume_skills)))

        skill_match_score = calculate_skill_match_score(jd_skills, resume_skills)

        final_score = round((0.6 * ml_score) + (0.4 * skill_match_score))
        final_score = max(0, min(100, final_score))

        verdict = get_verdict(final_score)
        recommendations = get_recommendations(missing_skills, final_score)

        return {
            "ats_score": final_score,
            "job_fit_score": final_score,
            "ml_score": ml_score,
            "skill_match_score": skill_match_score,
            "verdict": verdict,
            "jd_skills": jd_skills,
            "resume_skills": resume_skills,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "recommendations": recommendations,
            "resume_words": resume_word_count,
            "jd_words": jd_word_count,
            "extracted_preview": resume_text[:700],
            "message": "Hybrid analysis successful",
        }

    except Exception as e:
        return {"error": str(e)}