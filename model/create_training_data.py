import pandas as pd
import random

def create_balanced_dataset():
    data = []
    
    # --- 1. CORE VOCABULARY ---
    subjects = ["The app", "Customer service", "The interface", "Loading speed", "Battery usage", 
                "The new feature", "Support team", "Design", "Connection", "The update", "Performance"]
    
    # Positive Adjectives (Strong & Mild)
    pos_adj = ["amazing", "great", "excellent", "flawless", "superb", "fantastic", "smooth", "fast", 
               "intuitive", "beautiful", "helpful", "polite", "wonderful", "perfect", "clean", "responsive"]
    
    # Negative Adjectives
    neg_adj = ["terrible", "horrible", "awful", "useless", "broken", "buggy", "slow", "confusing", 
               "cluttered", "rude", "unhelpful", "laggy", "garbage", "trash", "disappointing", "ugly"]

    neutral_phrases = ["Update available", "Maintenance scheduled", "Logged in successfully", 
                       "Please wait", "Loading data", "Version 2.3.1", "Terms updated", 
                       "Privacy policy", "Check your email", "Account verified", "Wifi connected",
                       "System rebooting", "File saved", "Upload complete"]

    # --- 2. GENERATION LOGIC ---

    # A. General Positive (400 lines)
    for _ in range(400):
        sub = random.choice(subjects)
        adj = random.choice(pos_adj)
        data.append({"text": f"{sub} is {adj}", "label": 1})

    # B. General Negative (400 lines)
    for _ in range(400):
        sub = random.choice(subjects)
        adj = random.choice(neg_adj)
        data.append({"text": f"{sub} is {adj}", "label": 0})

    # C. BIAS FIX: "Interface" Specifics (50 lines)
    # Force model to learn "Interface" can be good
    for _ in range(50):
        data.append({"text": "The interface is beautiful", "label": 1})
        data.append({"text": "I love the new interface", "label": 1})
        data.append({"text": "Interface is clean and simple", "label": 1})
        data.append({"text": "User interface is fantastic", "label": 1})

    # D. "Not" Negation Logic (100 lines)
    for _ in range(100):
        sub = random.choice(subjects)
        adj = random.choice(pos_adj)
        data.append({"text": f"{sub} is not {adj}", "label": 0})

    # E. Sarcasm (Trigrams) (50 lines)
    sarcastic_templates = [
        "Great job breaking the {noun}", "Thanks for deleting my {noun}", 
        "I love waiting {time} for it to load", "Genius move removing the {noun}",
        "Another brilliant update that broke everything", "Wow simply amazing logic",
        "My dog could code better"
    ]
    nouns = ["data", "save button", "account", "feature", "app"]
    for _ in range(50):
        text = random.choice(sarcastic_templates).format(noun=random.choice(nouns), time="10 mins")
        data.append({"text": text, "label": 0})

    # F. NUMBERS FIX: Ratings (100 lines)
    # We use variations to ensure robustness
    for i in range(50):
        score = random.randint(7, 10)
        data.append({"text": f"Rated {score} out of 10", "label": 1})
        data.append({"text": f"I give it a {score}/10", "label": 1})
        data.append({"text": f"Score: {score} stars", "label": 1})

    for i in range(50):
        score = random.randint(0, 4)
        data.append({"text": f"Rated {score} out of 10", "label": 0})
        data.append({"text": f"I give it a {score}/10", "label": 0})
        data.append({"text": f"Score: {score} stars", "label": 0})

    # G. Neutral (200 lines)
    for _ in range(200):
        text = random.choice(neutral_phrases)
        data.append({"text": text, "label": 2})

    # Shuffle and Save
    random.shuffle(data)
    df = pd.DataFrame(data)
    df.to_csv('sentiment_training_data.csv', index=False)
    print(f"✅ Created balanced dataset with {len(df)} rows.")

if __name__ == "__main__":
    create_balanced_dataset()