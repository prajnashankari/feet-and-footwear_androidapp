from flask import Flask, request, jsonify
import pandas as pd
import os
import cv2
from werkzeug.utils import secure_filename
from utils import preprocess, kMeans_cluster, edgeDetection, getBoundingBox, estimate_foot_parameters
from db import get_db_connection

app = Flask(__name__)
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def home():
    return jsonify({'message': 'API is running'})

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO users (email, password) VALUES (%s, %s) RETURNING id", (email, password))
        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Registration successful", "user_id": user_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, email, password FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    print("Fetched user:", user)  # Debugging the user data

    if user and password == user[2]:  # user[2] is the password
        return jsonify({"message": "Login successful", "user_id": user[0]})
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@app.route('/edit_profile', methods=['PUT'])
def edit_profile():
    data = request.get_json()
    user_id = data.get('user_id')
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE users SET name=%s, email=%s, phone=%s WHERE id=%s",
                (name, email, phone, user_id))
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Profile updated successfully"})

@app.route('/upload', methods=['POST'])
def upload_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file format. Allowed formats: png, jpg, jpeg, gif'}), 400

        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        img = cv2.imread(filepath)
        if img is None:
            return jsonify({'error': 'Failed to read the uploaded image'}), 400

        result = estimate_foot_parameters(img)
        if result is None:
            return jsonify({'error': 'Foot could not be detected. Try again with a clearer image.'}), 400

        return jsonify({
            'image_path': f'/static/uploads/{filename}',
            'foot_height': result['foot_height'],
            'foot_width': result['foot_width'],
            'paper_height': result['paper_height'],
            'paper_width': result['paper_width'],
            'foot_size_cm': result['foot_size_cm']
        })
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
    

@app.route('/get_url', methods=['POST'])
def get_url():
    data = request.get_json()

    # Log the incoming data to check what is being received
    print(f"Received data: {data}")

    # Check if 'footSize' is in the request data and is not None or empty
    foot_size_str = data.get('foot_size_cm')
    if foot_size_str is None or foot_size_str == '':
        return jsonify({"error": "Foot size not provided"}), 400

    try:
        foot_size = float(foot_size_str)  # Convert foot size to float
    except ValueError:
        return jsonify({"error": "Invalid foot size value"}), 400

    gender = data.get('gender', '').lower()
    platform = data.get('platform', '').lower()

    # Build the path to the CSV
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # go up to project root
    csv_path = os.path.join(base_dir, 'excel', platform, f"{gender}.csv")

    # Check if CSV exists
    if not os.path.exists(csv_path):
        return jsonify({"error": "Platform or gender file not found"}), 404

    # Read CSV and match foot size
    df = pd.read_csv(csv_path)

    # Get the available foot sizes from the CSV (rounded to nearest available size)
    available_sizes = df['cm'].unique()

    # Find the closest available size
    rounded_foot_size = min(available_sizes, key=lambda x: abs(x - foot_size))

    # Check if the rounded size exists in the dataframe
    try:
        row = df[df['cm'] == rounded_foot_size].iloc[0]
        url = row['url']
        return jsonify({"url": url})
    except IndexError:
        return jsonify({"error": "Foot size not found"}), 404


if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(host='0.0.0.0', port=5000, debug=True)

