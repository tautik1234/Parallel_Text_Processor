import sqlite3
import multiprocessing as mp
import time
import os
import joblib 
import re
import pandas as pd
from nltk.corpus import stopwords

DATABASE_FILE = 'project_results.db'
ASSET_PATH = r'C:\Users\tauti\Downloads\model' 
INPUT_CSV = r'C:\Users\tauti\Downloads\model\input_data.csv'

def init_worker():
    global model, vectorizer, stop_words
    model_path = os.path.join(ASSET_PATH, 'sentiment_model.pkl')
    vect_path = os.path.join(ASSET_PATH, 'tfidf_vectorizer.pkl')
    
    model = joblib.load(model_path)
    vectorizer = joblib.load(vect_path)
    stop_words = set(stopwords.words('english'))

# ML scoring function
def ml_checker_and_scorer(text_segment, result_queue):
    # 1.Clean text
    cleaned = re.sub(r'\W', ' ', str(text_segment).lower()).strip()
    cleaned = ' '.join(word for word in cleaned.split() if word not in stop_words)
        
    # 2.Vectorize & Predict
    text_vector = vectorizer.transform([cleaned])
    prediction = model.predict(text_vector)[0]
        
    # 3.Labeling based on Logistic Regression result
    label = "Positive" if prediction == 1 else "Negative"
    score = 1.0 if prediction == 1 else -1.0
            
    result = {
        'text_segment': text_segment,
        'sentiment_label': label,
        'raw_score': score,
        'process_id': os.getpid(),
        'time_finished': time.time()
    }
    result_queue.put(result)

# Database setup function
def setup_database_and_write_to_db(result_queue, total_tasks):
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sentiment_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text_segment TEXT,
            sentiment_label TEXT,
            raw_score REAL,
            process_id INTEGER,
            time_finished REAL
        )
    """)
    cursor.execute("DELETE FROM sentiment_scores") 

    tasks_written = 0
    while tasks_written < total_tasks:
        try:
            res = result_queue.get(timeout=5)
            cursor.execute("""
                INSERT INTO sentiment_scores (text_segment, sentiment_label, raw_score, process_id, time_finished) 
                VALUES (?, ?, ?, ?, ?)
            """, (res['text_segment'], res['sentiment_label'], res['raw_score'], res['process_id'], res['time_finished']))
            conn.commit()
            tasks_written += 1
        except:
            continue
    conn.close()

if __name__ == '__main__':

    df = pd.read_csv(INPUT_CSV)
    text_list = df['text'].astype(str).tolist()
    print(f"Loaded {len(text_list)} rows from CSV.")

    manager = mp.Manager()
    queue = manager.Queue() 
    
    writer = mp.Process(target=setup_database_and_write_to_db, args=(queue, len(text_list)))
    writer.start()
    
    start_time = time.time()
    with mp.Pool(processes=os.cpu_count(), initializer=init_worker) as pool:
        pool.starmap(ml_checker_and_scorer, [(t, queue) for t in text_list])
    
    writer.join()
    
    print(f"\n SUCCESS: Processed {len(text_list)} rows in {time.time() - start_time:.2f}s.")
    
    # Final Database Check
    conn = sqlite3.connect(DATABASE_FILE)
    print("\n--- Final Database Contents (Sample) ---")
    for row in conn.execute("SELECT text_segment, sentiment_label FROM sentiment_scores LIMIT 10"):
        print(row)
    conn.close()