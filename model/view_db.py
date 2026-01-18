# view_database.py
import sqlite3
import pandas as pd
import time

DATABASE_FILE = 'project_results.db'

# Connect to database
conn = sqlite3.connect(DATABASE_FILE)

# Method 1: View as pandas DataFrame (easiest)
print("=== Viewing with Pandas ===")
df = pd.read_sql_query("SELECT * FROM sentiment_scores", conn)
print(f"Total records: {len(df)}")
print("\nFirst 10 records:")
print(df.head(10))
print("\n" + "="*50)

# Method 2: View statistics
print("\n=== Statistics ===")
# Count by sentiment
sentiment_counts = pd.read_sql_query("""
    SELECT sentiment_label, COUNT(*) as count, 
           COUNT(*)*100.0/(SELECT COUNT(*) FROM sentiment_scores) as percentage
    FROM sentiment_scores 
    GROUP BY sentiment_label
""", conn)
print("Sentiment Distribution:")
print(sentiment_counts.to_string(index=False))

# Method 3: View all data with better formatting
print("\n=== Full Results (formatted) ===")
cursor = conn.cursor()
cursor.execute("SELECT * FROM sentiment_scores")
rows = cursor.fetchall()

# Get column names
column_names = [description[0] for description in cursor.description]
print(f"Columns: {', '.join(column_names)}")
print("-"*80)

for row in rows:
    # Truncate long text for display
    text_preview = row[1][:50] + "..." if len(str(row[1])) > 50 else row[1]
    print(f"ID: {row[0]}")
    print(f"Text: {text_preview}")
    print(f"Label: {row[2]} | Score: {row[3]} | Process ID: {row[4]}")
    print(f"Time: {time.ctime(row[5])}" if len(row) > 5 else "")
    print("-"*80)

conn.close()