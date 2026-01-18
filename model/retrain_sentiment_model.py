import pandas as pd
import joblib
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from nltk.corpus import stopwords
import nltk

nltk.download('stopwords')

def smart_clean_text(text):
    if pd.isna(text): return ""
    text = str(text).lower()
    # Keep letters AND numbers
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Custom Stopwords (Keep Negations)
    stop_words = set(stopwords.words('english'))
    negations = {'no', 'not', 'nor', 'never', 'none', 'neither'}
    stop_words = stop_words - negations
    
    words = text.split()
    words = [word for word in words if word not in stop_words]
    return ' '.join(words)

# 1. Load the new balanced data
print("Loading data...")
df = pd.read_csv('sentiment_training_data.csv')
df['cleaned_text'] = df['text'].apply(smart_clean_text)

X = df['cleaned_text']
y = df['label']

# 2. Vectorizer Upgrade
print("Vectorizing...")
vectorizer = TfidfVectorizer(
    max_features=2500,
    min_df=1,
    ngram_range=(1, 3),       # Trigrams for sarcasm
    token_pattern=r'(?u)\b\w+\b', # <--- CRITICAL FIX: Allows single digits (e.g. "7")
    use_idf=True
)

X_vec = vectorizer.fit_transform(X)

# 3. Train Model
print("Training...")
model = LogisticRegression(
    max_iter=1000,
    random_state=42,
    class_weight='balanced'
)

model.fit(X_vec, y)

# 4. Save
joblib.dump(model, 'sentiment_model.pkl')
joblib.dump(vectorizer, 'tfidf_vectorizer.pkl')
print("✅ New Model & Vectorizer Saved!")

# 5. Quick Verification
test_sentences = [
    "The interface is beautiful",   # Bias Check
    "Rated 7 out of 10",            # Number Check
    "Great job breaking it"         # Sarcasm Check
]
print("\n--- Final Verification ---")
label_map = {0: 'Negative', 1: 'Positive', 2: 'Neutral'}
for t in test_sentences:
    cleaned = smart_clean_text(t)
    vec = vectorizer.transform([cleaned])
    pred = model.predict(vec)[0]
    print(f"'{t}' -> {label_map[pred]}")