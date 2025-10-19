import psycopg2

def get_db_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="footapp",
        user="postgres",
        password="root"
    )
    return conn
