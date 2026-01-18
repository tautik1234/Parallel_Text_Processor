# setup_check.py
import os
import nltk
import pandas as pd
import joblib
from pathlib import Path

def check_setup():
    print("=== Setup Check ===")
    
    # 1. Check NLTK data
    try:
        nltk.data.find('corpora/stopwords')
        print("✓ NLTK stopwords installed")
    except LookupError:
        print("✗ NLTK stopwords missing. Run: nltk.download('stopwords')")
        nltk.download('stopwords')
    
    # 2. Check model files
    ASSET_PATH = r'C:\Users\tauti\Downloads\model'
    required_files = ['sentiment_model.pkl', 'tfidf_vectorizer.pkl']
    
    for file in required_files:
        file_path = os.path.join(ASSET_PATH, file)
        if os.path.exists(file_path):
            print(f"✓ Found {file}")
        else:
            print(f"✗ Missing: {file_path}")
    
    # 3. Check input CSV
    INPUT_CSV = r'C:\Users\tauti\Downloads\model\input_data.csv'
    if os.path.exists(INPUT_CSV):
        try:
            df = pd.read_csv(INPUT_CSV)
            if 'text' in df.columns:
                print(f"✓ CSV loaded successfully with {len(df)} rows")
            else:
                print("✗ CSV missing 'text' column")
        except Exception as e:
            print(f"✗ Error reading CSV: {e}")
    else:
        print(f"✗ Missing input CSV: {INPUT_CSV}")
    
    # 4. Test model loading
    try:
        model_path = os.path.join(ASSET_PATH, 'sentiment_model.pkl')
        vect_path = os.path.join(ASSET_PATH, 'tfidf_vectorizer.pkl')
        model = joblib.load(model_path)
        vectorizer = joblib.load(vect_path)
        print("✓ Models loaded successfully")
    except Exception as e:
        print(f"✗ Error loading models: {e}")

if __name__ == '__main__':
    check_setup()