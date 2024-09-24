import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
from datetime import datetime
import os
import time


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


def deadlock_demo():

 
    connection1 = create_connection()  
    connection2 = create_connection()  

    try:
       
        cursor1 = connection1.cursor()
        cursor2 = connection2.cursor()

  
        cursor1.execute("SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE")
        cursor2.execute("SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE")


        print(f"Transaction 1 (Alice) started: {datetime.now()}")
        connection1.start_transaction()
        cursor1.execute("SELECT balance FROM accounts WHERE name = 'Alice'")
        balance_alice = cursor1.fetchone() 
        time.sleep(2) 

       
        print(f"Transaction 2 (Bob) started: {datetime.now()}")
        connection2.start_transaction()
        cursor2.execute("SELECT balance FROM accounts WHERE name = 'Bob'")
        balance_bob = cursor2.fetchone()  
        time.sleep(2)  

        
        cursor1.execute("UPDATE accounts SET balance = balance + 100 WHERE name = 'Bob'")
        cursor2.execute("UPDATE accounts SET balance = balance + 100 WHERE name = 'Alice'")

       
        connection1.commit()
        connection2.commit()

    except Error as e:
      
        print(f"Deadlock detected: {e}")
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
    print("Demonstrating Deadlock:")
    deadlock_demo()
