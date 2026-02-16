import pyodbc

def get_connection():
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=LAPTOP-VB6I49QM;"
        "DATABASE=DB_CGPVP2;"
        "Trusted_Connection=yes;"
    )
    return conn