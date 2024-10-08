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


def read_uncommitted():
  
    connection1 = create_connection()
    connection2 = create_connection()

    try:
        cursor1 = connection1.cursor()
        cursor2 = connection2.cursor()


        cursor1.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED")
        cursor2.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED")

   
        print(f"Transaction 1 started: {datetime.now()}")
        connection1.start_transaction()
        cursor1.execute("UPDATE accounts SET balance = balance - 500 WHERE name = 'Alice'")


        time.sleep(2)

      
        print(f"Transaction 2 started: {datetime.now()}")
        connection2.start_transaction()
        cursor2.execute("SELECT balance FROM accounts WHERE name = 'Alice'")
        balance_dirty_read_alice = cursor2.fetchone()[0]

        cursor2.execute("SELECT balance FROM accounts WHERE name = 'Bob'")
        balance_dirty_read_bob = cursor2.fetchone()[0]

        print(f"Dirty Read (READ UNCOMMITTED): Alice's balance = {balance_dirty_read_alice}")
        print(f"Dirty Read (READ UNCOMMITTED): Bob's balance = {balance_dirty_read_bob}")


        print(f"Transaction 1 rollback(): {datetime.now()}")
        connection1.rollback()

   
        print(f"Transaction 2 commit(): {datetime.now()}")
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
    print("Demonstrating READ UNCOMMITTED:")
    read_uncommitted()