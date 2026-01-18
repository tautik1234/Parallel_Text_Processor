import pickle
import torch

file_path=r'C:\Users\tauti\Downloads\Infosys_SpringBoard_project-main\Infosys_SpringBoard_project-main\model\sentiment_model.pkl'

try:
    with open(file_path,'rb') as file:
        data=torch.load(file)
    print(data)
except Exception as e:
    print(f"Error 69: {e}")