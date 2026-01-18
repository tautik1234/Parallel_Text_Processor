import pandas as pd
import random

def generate_final_test_dataset():
    data = []
    
    # --- WORD BANKS ---
    subjects = ["The application", "Customer support", "User interface", "Sync speed", "Battery life", 
                "The dashboard", "Tech support", "Visual design", "Connectivity", "The latest patch"]
    
    pos_adj = ["incredible", "outstanding", "flawless", "superb", "top-notch", "smooth", "blazing fast", 
               "intuitive", "gorgeous", "helpful", "polite", "rock solid", "perfect", "clean"]
               
    neg_adj = ["abysmal", "horrendous", "useless", "broken", "glitchy", "sluggish", "confusing", 
               "cluttered", "rude", "incompetent", "unstable", "garbage", "bloated", "ugly"]
               
    neutral_phrases = ["System update available", "Scheduled maintenance", "Login successful", 
                       "Please wait...", "Downloading resources", "Version 4.0.1", "Terms of Service", 
                       "Privacy Policy updated", "Email verification sent", "Wifi signal found", 
                       "Saving changes...", "Export complete", "Ticket #99281 created"]

    # --- GENERATION LOGIC (Total: ~1,500 lines) ---

    # 1. Standard Positive (450 lines)
    for _ in range(450):
        sub = random.choice(subjects)
        adj = random.choice(pos_adj)
        data.append({"text": f"{sub} is {adj}", "label": 1})

    # 2. Standard Negative (450 lines)
    for _ in range(450):
        sub = random.choice(subjects)
        adj = random.choice(neg_adj)
        data.append({"text": f"{sub} is {adj}", "label": 0})

    # 3. BIAS CHECK: Positive "Interface" (100 lines)
    # *Crucial*: Tests if we fixed the "Interface = Bad" bias
    interface_positives = [
        "The interface is beautiful", "I love the new interface", 
        "Interface is clean and simple", "User interface is fantastic",
        "The interface design is a work of art"
    ]
    for _ in range(100):
        data.append({"text": random.choice(interface_positives), "label": 1})

    # 4. NUMBERS CHECK: Ratings (100 lines)
    # *Crucial*: Tests if vectorizer sees single digits (e.g., "7")
    for _ in range(50): # Positive Ratings
        score = random.randint(7, 10)
        data.append({"text": f"Rated {score} out of 10", "label": 1})
        data.append({"text": f"I give it a {score}/10", "label": 1})
        
    for _ in range(50): # Negative Ratings
        score = random.randint(0, 4)
        data.append({"text": f"Rated {score} out of 10", "label": 0})
        data.append({"text": f"Score: {score} stars", "label": 0})

    # 5. LOGIC CHECK: Negations (100 lines)
    # Tests "not good" (Negative) and "not bad" (Positive)
    for _ in range(50):
        sub = random.choice(subjects)
        adj = random.choice(pos_adj) 
        data.append({"text": f"{sub} is not {adj}", "label": 0}) # "Not flawless" -> Neg
        
    for _ in range(50):
        sub = random.choice(subjects)
        adj = random.choice(neg_adj)
        data.append({"text": f"{sub} is not {adj}", "label": 1}) # "Not garbage" -> Pos

    # 6. LOGIC CHECK: Sarcasm (100 lines)
    # Tests Trigrams ("Great job breaking")
    sarcastic_templates = [
        "Great job breaking the {noun}", "Thanks for deleting my {noun}", 
        "I love waiting {time} for it to load", "Genius move removing the {noun}",
        "Another brilliant update that broke everything", "Wow simply amazing logic",
        "My cat could code better than this"
    ]
    nouns = ["database", "save file", "account", "search bar", "login"]
    for _ in range(100):
        text = random.choice(sarcastic_templates).format(noun=random.choice(nouns), time="20 mins")
        data.append({"text": text, "label": 0})

    # 7. Neutral System Messages (200 lines)
    for _ in range(200):
        data.append({"text": random.choice(neutral_phrases), "label": 2})

    # Shuffle and Save
    random.shuffle(data)
    df = pd.DataFrame(data)
    df.to_csv('final_test_dataset_1500.csv', index=False)
    
    print(f"✅ Generated 'final_test_dataset_1500.csv' with {len(df)} rows.")
    print("--- Distribution ---")
    print(df['label'].value_counts())

if __name__ == "__main__":
    generate_final_test_dataset()