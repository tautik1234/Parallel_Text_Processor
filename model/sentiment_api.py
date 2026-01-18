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

warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)  # Allow requests from Node.js

# ===== CONFIGURATION =====
# These will come from Node.js API call
ASSET_PATH = os.path.join(os.path.dirname(__file__))  # Where models are stored
MONGO_URI = os.environ.get('MONGO_URI')

if not MONGO_URI:
    # Optional: Fallback for local testing ONLY if you aren't using the .env file correctly yet,
    # but theoretically, you should rely 100% on .env
    print("⚠️ WARNING: MONGO_URI not found in environment variables.")

# Global resources (loaded once on first request)
model = None
vectorizer = None
stop_words = None
mongo_client = None

# ===== MEMORY DETECTION ENGINE =====
def get_available_memory_mb():
    """
    Detects available memory limit (works on Docker/Render/Linux).
    Returns total memory in MB.
    """
    try:
        # Try cgroup v1 (Common in Docker/Render)
        if os.path.exists('/sys/fs/cgroup/memory/memory.limit_in_bytes'):
            with open('/sys/fs/cgroup/memory/memory.limit_in_bytes') as f:
                return int(f.read()) / (1024 * 1024)
        
        # Try cgroup v2
        elif os.path.exists('/sys/fs/cgroup/memory.max'):
            with open('/sys/fs/cgroup/memory.max') as f:
                content = f.read().strip()
                if content == "max": return 8192 # Arbitrary high number if unconstrained
                return int(content) / (1024 * 1024)
                
        # Fallback to standard Linux meminfo
        elif os.path.exists('/proc/meminfo'):
            with open('/proc/meminfo') as f:
                for line in f:
                    if 'MemTotal' in line:
                        return int(line.split()[1]) / 1024
        
        return 512 # Conservative fallback
    except:
        return 512 # Conservative fallback

def init_resources():
    """Initialize ML models and MongoDB connection once"""
    global model, vectorizer, stop_words, mongo_client
    
    if model is None:
        try:
            # Load ML models
            model_path = os.path.join(ASSET_PATH, 'sentiment_model.pkl')
            vect_path = os.path.join(ASSET_PATH, 'tfidf_vectorizer.pkl')
            
            model = joblib.load(model_path)
            vectorizer = joblib.load(vect_path)
            
            # Download stopwords if not present
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
    """Initialize worker process for multiprocessing (NO MongoDB)"""
    global model, vectorizer, stop_words
    
    if model is None:
        try:
            # Load ML models only (no MongoDB)
            model_path = os.path.join(ASSET_PATH, 'sentiment_model.pkl')
            vect_path = os.path.join(ASSET_PATH, 'tfidf_vectorizer.pkl')
            
            model = joblib.load(model_path)
            vectorizer = joblib.load(vect_path)
            
            # Ensure stopwords are available in worker
            try:
                nltk.data.find('corpora/stopwords')
            except LookupError:
                nltk.download('stopwords')
                
            stop_words = set(stopwords.words('english'))
            
            print(f"✅ Worker {os.getpid()} loaded models")
        except Exception as e:
            print(f"❌ Worker {os.getpid()} failed: {e}")
            raise

# ======================================================
#  CRITICAL UPDATE: THE SMART CLEANER
# ======================================================
def clean_text(text):
    """
    Clean text for sentiment analysis.
    UPDATED: Now preserves 'not', 'no', and numbers.
    """
    if pd.isna(text):
        return ""
    
    text = str(text).lower()
    
    # FIX 1: Keep letters AND numbers (Context: "4 out of 10")
    # Old code was: re.sub(r'[^a-zA-Z\s]', ' ', text)
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    
    text = re.sub(r'\s+', ' ', text).strip()
    
    # FIX 2: Handle stopwords but EXPLICITLY KEEP negations
    global stop_words
    
    # Safety check if clean_text is called before init
    if stop_words is None:
        stop_words = set(stopwords.words('english'))

    # Define negations we must KEEP for the model to understand "not good"
    negations = {'no', 'not', 'nor', 'never', 'none', 'neither'}
    
    # Create a safe list by removing negations from the standard stoplist
    safe_stop_words = stop_words - negations
    
    words = text.split()
    words = [word for word in words if word not in safe_stop_words]
    
    return ' '.join(words)

# ======================================================
#  END CRITICAL UPDATE
# ======================================================

def analyze_single_text(text):
    """Analyze single text segment - updated for 3 classes"""
    try:
        # Clean text
        cleaned = clean_text(text)
        
        if not cleaned.strip():
            return {
                'originalText': text,
                'sentimentScore': 0.0,
                'sentimentLabel': 'neutral',
                'confidence': 0.0,
                'keywords': [],
                'error': 'Empty text after cleaning'
            }
        
        # Vectorize & Predict
        text_vector = vectorizer.transform([cleaned])
        prediction = model.predict(text_vector)[0]
        
        # Get probability if available
        confidence = 0.0
        try:
            probabilities = model.predict_proba(text_vector)[0]
            confidence = max(probabilities)
        except:
            confidence = 1.0
        
        # Determine sentiment (NOW 3 CLASSES)
        # Assuming model maps: 0=Negative, 1=Positive, 2=Neutral
        if prediction == 0:  # Negative
            label = "negative"
            score = -1.0
        elif prediction == 1:  # Positive
            label = "positive"
            score = 1.0
        else:  # prediction == 2 (Neutral)
            label = "neutral"
            score = 0.0
        
        # Extract keywords
        keywords = [word for word in cleaned.split() if len(word) > 2][:10]
        
        return {
            'originalText': text,
            'sentimentScore': float(score),
            'sentimentLabel': label,
            'confidence': float(confidence),
            'keywords': keywords,
            'cleanedText': cleaned,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            'originalText': text,
            'sentimentScore': 0.0,
            'sentimentLabel': 'neutral',
            'confidence': 0.0,
            'keywords': [],
            'error': str(e)
        }

# ===== ENGINE 1: PARALLEL PROCESSOR =====
def process_texts_parallel(text_list):
    """
    High-Performance Mode: Uses Multiprocessing.
    Requirement: Needs ~1.2GB+ RAM.
    """
    workers = min(mp.cpu_count(), 4) # Cap at 4 workers safely
    print(f"🚀 PARALLEL MODE ACTIVATED: Using {workers} workers")
    
    with mp.Pool(processes=workers, initializer=init_worker) as pool:
        results = pool.map(analyze_single_text, text_list)
        
    return results, workers

# ===== ENGINE 2: SEQUENTIAL PROCESSOR =====
def process_texts_sequentially(text_list):
    """
    Safe Mode: Uses Single Process.
    Requirement: Low RAM (~300MB).
    """
    print(f"🐢 SEQUENTIAL MODE ACTIVATED: Saving RAM")
    init_resources() # Ensure loaded in main process
    
    results = []
    for text in text_list:
        results.append(analyze_single_text(text))
        
    return results, 1

# ===== THE SMART DISPATCHER =====
def smart_process_texts(text_list, job_id=None, user_id=None):
    start_time = time.time()
    
    # 1. Detect RAM
    total_mem = get_available_memory_mb()
    print(f"💾 Detected System Memory: {total_mem:.2f} MB")
    
    # 2. Decide Strategy
    # Threshold: We need at least 1500MB to comfortably run parallel workers
    # Render Free Tier is 512MB -> This will correctly choose Sequential
    if total_mem > 1500 and len(text_list) > 100:
        try:
            results, workers_used = process_texts_parallel(text_list)
        except Exception as e:
            print(f"⚠️ Parallel crashed ({e}), falling back to Sequential...")
            results, workers_used = process_texts_sequentially(text_list)
    else:
        if total_mem <= 1500:
            print("⚠️ Low Memory Detected (<1.5GB) - Forcing Sequential Mode")
        else:
            print("ℹ️ Small batch - Using Sequential Mode for speed")
        results, workers_used = process_texts_sequentially(text_list)

    # 3. Calculate Stats & Format
    processing_time = time.time() - start_time
    
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
                'cleanedText': result.get('cleanedText', '')
            }
        })
    
    return {
        'jobId': job_id,
        'userId': user_id,
        'totalLines': len(text_list),
        'processingTimeMs': int(processing_time * 1000),
        'workersUsed': workers_used,
        'processingMode': 'parallel' if workers_used > 1 else 'sequential',
        'averageSentiment': float(avg_sentiment),
        'sentimentDistribution': {
            'positive': pos_count,
            'neutral': neu_count,
            'negative': neg_count
        },
        'results': formatted_results,
        'status': 'completed',
        'completedAt': datetime.utcnow().isoformat()
    }

def read_file(file_path, file_type=None):
    """Read different file types (CSV, TXT)"""
    texts = []
    
    if file_type == 'csv' or file_path.endswith('.csv'):
        try:
            df = pd.read_csv(file_path)
            # Try common column names
            for col in ['text', 'content', 'message', 'review', 'comment']:
                if col in df.columns:
                    texts = df[col].astype(str).tolist()
                    print(f"📖 Read {len(texts)} texts from CSV column '{col}'")
                    break
            if not texts and len(df.columns) > 0:
                # Use first column as fallback
                texts = df.iloc[:, 0].astype(str).tolist()
                print(f"📖 Read {len(texts)} texts from first CSV column")
        except Exception as e:
            raise Exception(f"CSV read error: {e}")
    
    elif file_type == 'txt' or file_path.endswith('.txt'):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                # Read lines, skip empty ones
                texts = [line.strip() for line in f if line.strip()]
            print(f"📖 Read {len(texts)} lines from TXT file")
        except UnicodeDecodeError:
            # Try different encoding
            with open(file_path, 'r', encoding='latin-1') as f:
                texts = [line.strip() for line in f if line.strip()]
            print(f"📖 Read {len(texts)} lines from TXT file (latin-1 encoding)")
    
    else:
        # Try to auto-detect
        if file_path.endswith('.csv'):
            return read_file(file_path, 'csv')
        elif file_path.endswith('.txt'):
            return read_file(file_path, 'txt')
        else:
            raise Exception(f"Unsupported file type: {file_path}")
    
    return texts

# ===== API ENDPOINTS =====

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        init_resources()
        return jsonify({
            'status': 'healthy',
            'service': 'sentiment-analysis',
            'timestamp': datetime.utcnow().isoformat(),
            'models_loaded': model is not None,
            'mongo_connected': mongo_client is not None
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@app.route('/analyze', methods=['POST'])
def analyze_text():
    """Analyze single text (for testing)"""
    try:
        data = request.json
        text = data.get('text', '')
        
        init_resources()
        result = analyze_single_text(text)
        
        return jsonify({
            'success': True,
            'result': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

# Add this endpoint for easy Postman testing
@app.route('/test-process', methods=['POST'])
def test_process():
    """Test endpoint with sample data (no file needed)"""
    sample_texts = [
        "Excellent customer service and support.",
        "The interface is confusing and difficult to use.",
        "Happy New Year! Wishing everyone the best.",
        "It is not working as expected" # Added to test the fix
    ]
    
    try:
        init_resources()
        result = process_texts_parallel(sample_texts, "test_job_123", "test_user_456")
        return jsonify({'success': True, 'result': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/test-mongo', methods=['GET'])
def test_mongo():
    """Test MongoDB connection and collections"""
    try:
        init_resources()
        db = mongo_client.text_processor
        collections = db.list_collection_names()
        
        return jsonify({
            'success': True,
            'database': 'text_processor',
            'collections': collections,
            'processingjobs_exists': 'processingjobs' in collections
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/process-content', methods=['POST'])
def process_content():
    """Process text content directly (no file needed)"""
    try:
        data = request.json
        content = data.get('content', '')
        job_id = data.get('jobId')
        user_id = data.get('userId')
        
        if not content:
            return jsonify({'success': False, 'error': 'No content provided'}), 400
        
        print(f"📊 Processing {len(content)} characters from direct content")
        
        # Split into lines
        texts = [line.strip() for line in content.split('\n') if line.strip()]
        
        if not texts:
            return jsonify({'success': False, 'error': 'No text content found'}), 400
        
        # Process with your ML model (same function)
        processing_result = smart_process_texts(texts, job_id, user_id)
        
        # Update MongoDB if job_id provided
        if job_id and mongo_client:
            try:
                db = mongo_client.text_processor
                jobs_collection = db.processingjobs
                
                update_data = {
                    'status': 'completed',
                    'progress': 100,
                    'totalLines': processing_result['totalLines'],
                    'processingTimeMs': processing_result['processingTimeMs'],
                    'workersUsed': processing_result['workersUsed'],
                    'averageSentiment': processing_result['averageSentiment'],
                    'sentimentDistribution': processing_result['sentimentDistribution'],
                    'results': processing_result['results'],
                    'completedAt': datetime.utcnow()
                }
                
                result = jobs_collection.update_one(
                    {'_id': ObjectId(job_id)},
                    {'$set': update_data}
                )
                
                print(f"✅ Updated MongoDB job {job_id}")
                
            except Exception as e:
                print(f"⚠️ MongoDB update failed: {e}")
                processing_result['mongoUpdateError'] = str(e)
        
        return jsonify({
            'success': True,
            'jobId': job_id,
            'message': f'Processed {len(texts)} lines successfully',
            'processingResult': processing_result
        }), 200
        
    except Exception as e:
        error_msg = f"Content processing failed: {str(e)}"
        print(f"❌ {error_msg}")
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500

@app.route('/process-file', methods=['POST'])
def process_file():
    """Main endpoint: Process uploaded file and store in MongoDB"""
    global MONGO_URI, mongo_client
    try:
        # Get parameters from Node.js
        data = request.json
        file_path = data.get('filePath')
        job_id = data.get('jobId')
        user_id = data.get('userId')
        mongo_uri = data.get('mongoUri', MONGO_URI)
        
        # FIX: Try different possible locations
        if not file_path:
            return jsonify({'success': False, 'error': 'No file path provided'}), 400
        
        # Try 1: As given
        if os.path.exists(file_path):
            print(f"✅ Found file at: {file_path}")
        
        # Try 2: From project root (if relative path)
        elif os.path.exists(os.path.join('..', 'backend', 'uploads', os.path.basename(file_path))):
            new_path = os.path.join('..', 'backend', 'uploads', os.path.basename(file_path))
            print(f"✅ Found file at: {new_path}")
            file_path = new_path
        
        # Try 3: Absolute path
        elif os.path.exists(os.path.abspath(file_path)):
            file_path = os.path.abspath(file_path)
            print(f"✅ Found file at: {file_path}")
        
        else:
            # File not found anywhere
            print(f"❌ File NOT found. Tried: {file_path}")
            return jsonify({
                'success': False,
                'error': f'File not found. Python looked in: {os.getcwd()}'
            }), 400
        
        print(f"🚀 Starting processing for job {job_id}, file: {file_path}")
        
        # Update MongoDB URI if provided
        if mongo_uri != MONGO_URI:
            MONGO_URI = mongo_uri
            mongo_client = None  # Force reconnection
        
        # Read file based on type
        file_type = data.get('fileType')
        if not file_type:
            if file_path.endswith('.csv'):
                file_type = 'csv'
            elif file_path.endswith('.txt'):
                file_type = 'txt'
        
        texts = read_file(file_path, file_type)
        
        if not texts:
            return jsonify({
                'success': False,
                'error': 'No text content found in file'
            }), 400
        
        # Process texts in parallel
        processing_result = smart_process_texts(texts, job_id, user_id)
        
        # Update MongoDB if job_id provided
        if job_id and mongo_client:
            try:
                db = mongo_client.text_processor  # ✅ Database name from connection string
                jobs_collection = db.processingjobs  # ✅ Collection name (no underscore, lowercase plural)
                
                update_data = {
                    'status': 'completed',
                    'progress': 100,
                    'totalLines': processing_result['totalLines'],
                    'processingTimeMs': processing_result['processingTimeMs'],
                    'workersUsed': processing_result['workersUsed'],
                    'averageSentiment': processing_result['averageSentiment'],
                    'sentimentDistribution': processing_result['sentimentDistribution'],
                    'results': processing_result['results'],
                    'completedAt': datetime.utcnow()
                }
                
                # Update the job in MongoDB
                result = jobs_collection.update_one(
                    {'_id': ObjectId(job_id)},
                    {'$set': update_data}
                )
                
                print(f"✅ Updated MongoDB job {job_id}, matched: {result.matched_count}")
                
            except Exception as e:
                print(f"⚠️ MongoDB update failed (returning results anyway): {e}")
                processing_result['mongoUpdateError'] = str(e)
        
        return jsonify({
            'success': True,
            'jobId': job_id,
            'message': f'Processed {len(texts)} texts successfully',
            'processingResult': processing_result
        }), 200
        
    except Exception as e:
        error_msg = f"Processing failed: {str(e)}"
        print(f"❌ {error_msg}")
        
        # Update MongoDB status to failed if job_id exists
        if 'job_id' in locals() and job_id and mongo_client:
            try:
                db = mongo_client.text_processor
                jobs_collection = db.processingjobs
                jobs_collection.update_one(
                    {'_id': ObjectId(job_id)},
                    {'$set': {
                        'status': 'failed',
                        'errorMessage': error_msg,
                        'failedAt': datetime.utcnow()
                    }}
                )
            except:
                pass
        
        return jsonify({
            'success': False,
            'error': error_msg,
            'traceback': traceback.format_exc()
        }), 500

# ===== MAIN =====
if __name__ == '__main__':
    print("="*60)
    print("🤖 Sentiment Analysis API Service")
    print("="*60)
    print(f"Model path: {ASSET_PATH}")
    print(f"MongoDB URI: {MONGO_URI}")
    print("Starting server on http://localhost:8000")
    print("Endpoints:")
    print("  GET  /health        - Health check")
    print("  POST /analyze       - Analyze single text")
    print("  POST /process-file  - Process file and update MongoDB")
    print("="*60)
    
    # Pre-load resources
    try:
        init_resources()
        print("✅ Resources pre-loaded successfully")
    except Exception as e:
        print(f"⚠️ Resource loading failed (will load on first request): {e}")
    
    app.run(host='0.0.0.0', port=8000, debug=True)
