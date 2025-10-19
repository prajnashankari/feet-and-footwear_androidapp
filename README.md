# Feet and Footwear - Mobile App

This is the mobile version of the **Feet and Footwear** application — a user registration and authentication app using a PostgreSQL backend. This mobile app was built with React Native and uses Expo for development and testing.

The backend functionality is the same as the [Feet and Footwear Web App](https://github.com/prajnashankari/Feet-and-Footwear).

---

## 🔧 Requirements

### On Laptop (Backend Server):
- **PostgreSQL** (version 17)
- **Node.js** (latest stable recommended)
- **Python** (with necessary libraries)

### On Mobile:
- **Expo Go App** (from Play Store or App Store)

---

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/prajnashankari/feet-and-footwear_androidapp.git
cd feet-and-footwear_androidapp
````

---

### 2. Set Up PostgreSQL

Ensure PostgreSQL is running and create the required table:

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT
);
```

---
# (In VS Code)
### 3. Install Dependencies 

Install required Python packages (e.g. `psycopg2`):

```bash
pip install psycopg2
```

Install Node.js dependencies for the React Native frontend:

```bash
cd src/screens
npm install
```

---

### 4. Start the Backend

From the root directory or `backend/`, run:

```bash
cd backend
python app.py
```

This will start the Python backend API server.

---

### 5. Start the React Native App

In a new terminal window/tab:

```bash
cd src/screens
npm start
```

This will open Expo DevTools in your browser and display a QR code.

---

### 6. Run on Mobile Device

1. Open the **Expo Go App** on your mobile phone.
2. Scan the QR code displayed in your terminal or browser.
3. The app will load on your mobile device.

---

## 🔗 Related Project

* 🌐 [Feet and Footwear Web App](https://github.com/prajnashankari/Feet-and-Footwear)

---

## 📌 Notes

* Make sure your phone and laptop are on the same network for Expo to work.
* If you encounter issues with dependencies, check versions or run:

```bash
npm install --force
```
