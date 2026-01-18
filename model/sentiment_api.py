# sentiment_api.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import re
import pandas as pd
import numpy as np
from nltk.corpus import stopwords
import pymongo
from datetime import datetime
import multiprocessing as mp
from bson import ObjectId
import time
import os
import traceback
import warnings
import nltk
import sys
import io  # Critical for CSV parsing

warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)  # Allow requests from Node.js

# ===== CONFIGURATION =====
ASSET_PATH = os.path.join(os.path.dirname(__file__)) 
MONGO_URI = os.environ.get('MONGO_URI')

if not MONGO_URI:
    print("⚠️ WARNING: MONGO_URI not found in environment variables.")

# Global resources 
model = None
vectorizer = None
stop_words = None
mongo_client = None

# ===== 1. MEMORY DETECTION ENGINE =====
def get_available_memory_mb():
    """Detects available memory limit."""
    try:
        if os.path.exists('/sys/fs/cgroup/memory/memory.limit_in_bytes'):
            with open('/sys/fs/cgroup/memory/memory.limit_in_bytes') as f:
                return int(f.read()) / (1024 * 1024)
        elif os.path.exists('/sys/fs/cgroup/memory.max'):
            with open('/sys/fs/cgroup/memory.max') as f:
                content = f.read().strip()
                if content == "max": return 8192
                return int(content) / (1024 * 1024)
        elif os.path.exists('/proc/meminfo'):
            with open('/proc/meminfo') as f:
                for line in f:
                    if 'MemTotal' in line:
                        return int(line.split()[1]) / 1024
        return 512
    except:
        return 512

# ===== 2. INITIALIZATION =====
def init_resources():
    """Initialize ML models and MongoDB connection"""
    global model, vectorizer, stop_words, mongo_client
    
    if model is None:
        try:
            model_path = os.path.join(ASSET_PATH, 'sentiment_model.pkl')
            vect_path = os.path.join(ASSET_PATH, 'tfidf_vectorizer.pkl')
            model = joblib.load(model_path)
            vectorizer = joblib.load(vect_path)
            try:
                nltk.data.find('corpora/stopwords')
            except LookupError:
                nltk.download('stopwords')
            stop_words = set(stopwords.words('english'))
            print("✅ ML models loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load ML models: {e}")
            raise
    
    if mongo_client is None:
        try:
            mongo_client = pymongo.MongoClient(MONGO_URI)
            print("✅ MongoDB connected successfully")
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            raise

def init_worker():
    """Worker init for multiprocessing"""
    global model, vectorizer, stop_words
    if model is None:
        try:
            model_path = os.path.join(ASSET_PATH, 'sentiment_model.pkl')
            vect_path = os.path.join(ASSET_PATH, 'tfidf_vectorizer.pkl')
            model = joblib.load(model_path)
            vectorizer = joblib.load(vect_path)
            try:
                nltk.data.find('corpora/stopwords')
            except LookupError:
                nltk.download('stopwords')
            stop_words = set(stopwords.words('english'))
        except Exception as e:
            print(f"❌ Worker init failed: {e}")

# ===== 3. TEXT CLEANING & ANALYSIS =====
def clean_text(text):
    if pd.isna(text): return ""
    text = str(text).lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    global stop_words
    if stop_words is None: stop_words = set(stopwords.words('english'))
    negations = {'no', 'not', 'nor', 'never', 'none', 'neither'}
    safe_stop_words = stop_words - negations
    
    words = text.split()
    words = [word for word in words if word not in safe_stop_words]
    return ' '.join(words)

def analyze_single_text(text):
    try:
        cleaned = clean_text(text)
        if not cleaned.strip():
            return {
                'originalText': text, 'sentimentScore': 0.0, 'sentimentLabel': 'neutral',
                'confidence': 0.0, 'keywords': [], 'cleanedText': cleaned
            }
        
        text_vector = vectorizer.transform([cleaned])
        prediction = model.predict(text_vector)[0]
        
        confidence = 0.0
        try:
            probabilities = model.predict_proba(text_vector)[0]
            confidence = max(probabilities)
        except:
            confidence = 1.0
        
        if prediction == 0:
            label = "negative"
            score = -1.0
        elif prediction == 1:
            label = "positive"
            score = 1.0
        else:
            label = "neutral"
            score = 0.0
        
        keywords = [word for word in cleaned.split() if len(word) > 2][:10]
        
        return {
            'originalText': text, 'sentimentScore': float(score), 'sentimentLabel': label,
            'confidence': float(confidence), 'keywords': keywords, 'cleanedText': cleaned,
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {'originalText': text, 'error': str(e)}

# ===== 4. ENGINES =====
def process_texts_parallel(text_list):
    """High-Performance Mode"""
    workers = min(mp.cpu_count(), 4)
    with mp.Pool(processes=workers, initializer=init_worker) as pool:
        results = pool.map(analyze_single_text, text_list)
    return results, workers

def process_texts_sequentially(text_list):
    """Safe Mode"""
    init_resources()
    results = [analyze_single_text(t) for t in text_list]
    return results, 1

# ===== 5. SMART DISPATCHER =====
def smart_process_texts(text_list, job_id=None, user_id=None):
    start_time = time.time()
    total_mem = get_available_memory_mb()
    print(f"💾 Detected System Memory: {total_mem:.2f} MB")
    
    # Determine mode variable for logging
    mode = "sequential" 
    
    # Threshold: 1500MB
    if total_mem > 1500 and len(text_list) > 100:
        try:
            print("🚀 High RAM -> Parallel Mode")
            results, workers_used = process_texts_parallel(text_list)
            mode = "parallel" # <--- Track mode
        except Exception as e:
            print(f"⚠️ Parallel failed ({e}) -> Sequential Mode")
            results, workers_used = process_texts_sequentially(text_list)
            mode = "sequential"
    else:
        print("🐢 Low RAM/Small Batch -> Sequential Mode")
        results, workers_used = process_texts_sequentially(text_list)
        mode = "sequential"

    # Stats calculation
    scores = [r.get('sentimentScore', 0) for r in results if 'error' not in r]
    labels = [r.get('sentimentLabel', 'neutral') for r in results if 'error' not in r]
    
    if scores:
        avg_sentiment = sum(scores) / len(scores)
        pos_count = labels.count('positive')
        neg_count = labels.count('negative')
        neu_count = labels.count('neutral')
    else:
        avg_sentiment = 0.0
        pos_count = neg_count = neu_count = 0
    
    formatted_results = []
    for idx, result in enumerate(results):
        formatted_results.append({
            'lineNumber': idx + 1,
            'originalText': result.get('originalText', ''),
            'sentimentScore': result.get('sentimentScore', 0.0),
            'sentimentLabel': result.get('sentimentLabel', 'neutral'),
            'keywords': result.get('keywords', []),
            'patternsFound': ['ml_prediction'],
            'metadata': {
                'confidence': result.get('confidence', 0.0),
                'cleanedText': result.get('cleanedText', ''),
                'processId': os.getpid(),
                'processingTime': time.time()
            }
        })
    
    return {
        'jobId': job_id, 
        'userId': user_id, 
        'totalLines': len(text_list),
        'processingTimeMs': int((time.time() - start_time) * 1000),
        'workersUsed': workers_used,
        'averageSentiment': float(avg_sentiment),
        'sentimentDistribution': {'positive': pos_count, 'neutral': neu_count, 'negative': neg_count},
        'results': formatted_results, 
        'status': 'completed', 
        'processingMode': mode, # <--- THIS WAS MISSING!
        'completedAt': datetime.utcnow().isoformat()
    }
    
# ===== 6. API ENDPOINTS =====

@app.route('/health', methods=['GET'])
def health_check():
    try:
        init_resources()
        return jsonify({'status': 'healthy', 'models_loaded': True}), 200
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

@app.route('/process-content', methods=['POST'])
def process_content():
    """Process text content directly (Smart CSV Support)"""
    try:
        data = request.json
        content = data.get('content', '')
        filename = data.get('filename', 'unknown.txt').lower()
        job_id = data.get('jobId')
        user_id = data.get('userId')
        
        if not content: return jsonify({'success': False, 'error': 'No content'}), 400
        
        print(f"📊 Processing content from: {filename}")
        texts = []
        
        # SMART CSV PARSING
        if filename.endswith('.csv'):
            try:
                csv_file = io.StringIO(content)
                df = pd.read_csv(csv_file)
                found = False
                for col in ['text', 'content', 'message', 'review', 'comment']:
                    if col in df.columns:
                        texts = df[col].astype(str).tolist()
                        found = True
                        break
                if not found and len(df.columns) > 0:
                    texts = df.iloc[:, 0].astype(str).tolist() # Fallback
            except:
                texts = [line.strip() for line in content.split('\n') if line.strip()]
        else:
            texts = [line.strip() for line in content.split('\n') if line.strip()]
            
        if not texts: return jsonify({'success': False, 'error': 'No text found'}), 400
        
        # SMART PROCESSING
        result = smart_process_texts(texts, job_id, user_id)
        
        # MONGO UPDATE
        if job_id and mongo_client:
            try:
                mongo_client.text_processor.processingjobs.update_one(
                    {'_id': ObjectId(job_id)},
                    {'$set': {
                        'status': 'completed', 'progress': 100,
                        'results': result['results'],
                        'sentimentDistribution': result['sentimentDistribution'],
                        'processingMode': result.get('processingMode', 'sequential'),
                        'completedAt': datetime.utcnow()
                    }}
                )
                print(f"✅ Job {job_id} updated in MongoDB")
            except Exception as e:
                print(f"⚠️ Mongo Update Failed: {e}")
                
        return jsonify({'success': True, 'jobId': job_id, 'processingResult': result}), 200
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    try:
        init_resources()
    except: pass
    app.run(host='0.0.0.0', port=8000)
