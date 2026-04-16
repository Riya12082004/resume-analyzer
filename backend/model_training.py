import ast
import re
import joblib
import pandas as pd
from scipy.sparse import hstack, csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor


def safe_text(value):
    if pd.isna(value):
        return ""
    return str(value).strip()


def clean_list_like_text(value):
    text = safe_text(value)

    if not text:
        return ""

    try:
        parsed = ast.literal_eval(text)
        if isinstance(parsed, list):
            flat_items = []
            for item in parsed:
                if isinstance(item, list):
                    flat_items.extend([str(x) for x in item if str(x).strip()])
                else:
                    flat_items.append(str(item))
            return " ".join(flat_items)
    except Exception:
        pass

    text = text.replace("[", " ").replace("]", " ").replace("'", " ").replace('"', " ")
    text = re.sub(r"[^a-zA-Z0-9+#.\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


df = pd.read_csv("resume_data.csv")

text_columns = [
    "career_objective",
    "skills",
    "degree_names",
    "major_field_of_studies",
    "professional_company_names",
    "related_skils_in_job",
    "positions",
    "responsibilities",
    "languages",
    "certification_skills",
    "\ufeffjob_position_name",
    "educationaL_requirements",
    "experiencere_requirement",
    "responsibilities.1",
    "skills_required",
]

for col in text_columns:
    if col in df.columns:
        df[col] = df[col].apply(clean_list_like_text)

df["resume_text"] = (
    df["career_objective"].fillna("") + " " +
    df["skills"].fillna("") + " " +
    df["degree_names"].fillna("") + " " +
    df["major_field_of_studies"].fillna("") + " " +
    df["professional_company_names"].fillna("") + " " +
    df["related_skils_in_job"].fillna("") + " " +
    df["positions"].fillna("") + " " +
    df["responsibilities"].fillna("") + " " +
    df["languages"].fillna("") + " " +
    df["certification_skills"].fillna("")
)

df["jd_text"] = (
    df["\ufeffjob_position_name"].fillna("") + " " +
    df["educationaL_requirements"].fillna("") + " " +
    df["experiencere_requirement"].fillna("") + " " +
    df["responsibilities.1"].fillna("") + " " +
    df["skills_required"].fillna("")
)

df["combined_text"] = df["resume_text"] + " [SEP] " + df["jd_text"]

y = df["matched_score"]

df["resume_word_count"] = df["resume_text"].apply(lambda x: len(str(x).split()))
df["jd_word_count"] = df["jd_text"].apply(lambda x: len(str(x).split()))
df["resume_char_count"] = df["resume_text"].apply(lambda x: len(str(x)))
df["jd_char_count"] = df["jd_text"].apply(lambda x: len(str(x)))

numeric_features = df[
    ["resume_word_count", "jd_word_count", "resume_char_count", "jd_char_count"]
].fillna(0)

X_text_train, X_text_test, X_num_train, X_num_test, y_train, y_test = train_test_split(
    df["combined_text"],
    numeric_features,
    y,
    test_size=0.2,
    random_state=42,
)

vectorizer = TfidfVectorizer(
    max_features=10000,
    ngram_range=(1, 2),
    stop_words="english",
    min_df=2,
)

X_text_train_vec = vectorizer.fit_transform(X_text_train)
X_text_test_vec = vectorizer.transform(X_text_test)

X_train_sparse = hstack([X_text_train_vec, csr_matrix(X_num_train.values)])
X_test_sparse = hstack([X_text_test_vec, csr_matrix(X_num_test.values)])

X_train = X_train_sparse.toarray()
X_test = X_test_sparse.toarray()

model = XGBRegressor(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="reg:squarederror",
    random_state=42,
)

model.fit(X_train, y_train)

y_pred = model.predict(X_test)
y_pred = [max(0, min(1, pred)) for pred in y_pred]

r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)

print("R2 Score:", r2)
print("MAE:", mae)

joblib.dump(model, "model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")
print("XGBoost model and vectorizer saved successfully")