import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
from datetime import datetime
import os


load_dotenv()

HOST = os.getenv('host')
USER = os.getenv('user')
PASSWORD = os.getenv('password')
DATABASE = os.getenv('database')


def create_connection():
    try:
        connection = mysql.connector.connect(
            host=HOST,
            user=USER,
            password=PASSWORD,
            database=DATABASE
        )
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Error: {e}")
    return None


def repeatable_read():

    connection1 = create_connection() 
    connection2 = create_connection() 

    try:
        cursor1 = connection1.cursor()
        cursor2 = connection2.cursor()

      
        cursor1.execute("SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ")
        cursor2.execute("SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ")

       
        print(f"Transaction 1 (Alice) started: {datetime.now()}")
        connection1.start_transaction()
        cursor1.execute("SELECT balance FROM accounts WHERE name = 'Alice'")
        balance_alice_initial = cursor1.fetchone()[0]
        print(f"Alice's balance (initial): {balance_alice_initial}")

   
        print(f"Transaction 2 (Bob) started: {datetime.now()}")
        connection2.start_transaction()
        cursor2.execute("SELECT balance FROM accounts WHERE name = 'Alice'")
        balance_bob_first_read = cursor2.fetchone()[0]
        print(f"Bob's balance (first read): {balance_bob_first_read}")

     
        cursor1.execute("UPDATE accounts SET balance = balance + 100 WHERE name = 'Alice'")
        connection1.commit()

        cursor2.execute("SELECT balance FROM accounts WHERE name = 'Alice'")
        balance_bob_second_read = cursor2.fetchone()[0]
        print(f"Bob's balance (second read): {balance_bob_second_read}")


        connection2.commit()

    except Error as e:
        print(f"Error: {e}")
    finally:
        if cursor1:
            cursor1.close()
        if connection1 and connection1.is_connected():
            connection1.close()
        if cursor2:
            cursor2.close()
        if connection2 and connection2.is_connected():
            connection2.close()


if __name__ == "__main__":
    print("Demonstrating REPEATABLE READ:")
    repeatable_read()
