import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createDbConnection = async () => {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });
};

const executeReadUncommitted = async () => {
    const conn1 = await createDbConnection();
    const conn2 = await createDbConnection();

    try {
        console.log("Starting Transaction 1: Updating balances for Alice and Bob");
        await conn1.beginTransaction();
        console.log("Starting Transaction 2: Reading balances for Alice and Bob");
        await conn2.beginTransaction();
        await conn2.query("SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED");
        await conn1.query("SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED");
        await conn1.query("UPDATE accounts SET balance = 999 WHERE name = 'Alice'");
        await conn1.query("UPDATE accounts SET balance = 3000 WHERE name = 'Bob'");
       
       

        const[isolationLevel]= await conn2.query("SELECT @@transaction_isolation");
   
        console.log(`!  ${isolationLevel [0] ['@@transaction_isolation']}`);
        const [aliceData] = await conn2.query("SELECT balance FROM accounts WHERE name = 'Alice'");
        console.log(`Dirty Read (READ UNCOMMITTED): Alice's balance = ${aliceData[0].balance}`);

        const [bobData] = await conn2.query("SELECT balance FROM accounts WHERE name = 'Bob'");
        console.log(`Dirty Read (READ UNCOMMITTED): Bob's balance = ${bobData[0].balance}`);

        console.log("Rolling back Transaction 1");
        await conn1.rollback();
        console.log("Committing Transaction 2");
        await conn2.commit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
    } finally {
        await conn1.end();
        await conn2.end();
    }
};

const executeReadCommitted = async () => {
    const conn1 = await createDbConnection();
    const conn2 = await createDbConnection();

    try {
        console.log("Starting Transaction 1: Updating balances for Alice and Bob");
        await conn1.beginTransaction();
        await conn1.query("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED");
        await conn1.query("UPDATE accounts SET balance = 2000 WHERE name = 'Alice'");
        await conn1.query("UPDATE accounts SET balance = 3500 WHERE name = 'Bob'");

        console.log("Starting Transaction 2: Reading balances for Alice and Bob");
        await conn2.beginTransaction();
        await conn2.query("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED");

        const [aliceData] = await conn2.query("SELECT balance FROM accounts WHERE name = 'Alice'");
        console.log(`Read (READ COMMITTED): Alice's balance = ${aliceData[0].balance}`);

        const [bobData] = await conn2.query("SELECT balance FROM accounts WHERE name = 'Bob'");
        console.log(`Read (READ COMMITTED): Bob's balance = ${bobData[0].balance}`);

        console.log("Rolling back Transaction 1");
        await conn1.rollback();
        console.log("Committing Transaction 2");
        await conn2.commit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
    } finally {
        await conn1.end();
        await conn2.end();
    }
};

const executeRepeatableRead = async () => {
    const conn1 = await createDbConnection();
    const conn2 = await createDbConnection();

    try {
        console.log("Transaction 1: Setting isolation level to REPEATABLE READ");
        await conn1.beginTransaction();
        await conn1.query("SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ");

        const [initialData] = await conn1.query("SELECT balance FROM accounts WHERE name = 'Alice'");
        console.log(`Initial Read (REPEATABLE READ): Alice's balance = ${initialData[0].balance}`);

        await conn2.beginTransaction();
        await conn2.query("UPDATE accounts SET balance = 2500 WHERE name = 'Alice'");
        await conn2.commit(); 
        const [finalData] = await conn1.query("SELECT balance FROM accounts WHERE name = 'Alice'");
        console.log(`Final Read (REPEATABLE READ): Alice's balance = ${finalData[0].balance}`);

        await conn1.commit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
    } finally {
        await conn1.end();
        await conn2.end();
    }
};

const executeNonRepeatableRead = async () => {
    const conn1 = await createDbConnection();
    const conn2 = await createDbConnection();

    try {
        console.log("Transaction 1: Reading balance for Alice");
        await conn1.beginTransaction();
        const [initialData] = await conn1.query("SELECT balance FROM accounts WHERE name = 'Alice'");
        console.log(`Initial Read (Non-Repeatable): Alice's balance = ${initialData[0].balance}`);

        await conn2.beginTransaction();
        await conn2.query("UPDATE accounts SET balance = 3000 WHERE name = 'Alice'");
        await conn2.commit(); 

        const [finalData] = await conn1.query("SELECT balance FROM accounts WHERE name = 'Alice'");
        console.log(`Final Read (Non-Repeatable): Alice's balance = ${finalData[0].balance}`);

        await conn1.commit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
    } finally {
        await conn1.end();
        await conn2.end();
    }
};
//here i use gpt
const simulateDeadlock = async () => {
    const conn1 = await createDbConnection();
    const conn2 = await createDbConnection();

    try {
        console.log("Transaction 1: Updating Alice's balance");
        await conn1.beginTransaction();
        await conn1.query("UPDATE accounts SET balance = 4000 WHERE name = 'Alice'");

    
        await new Promise(resolve => setTimeout(resolve, 50));

        console.log("Transaction 2: Updating Bob's balance");
        await conn2.beginTransaction();
        await conn2.query("UPDATE accounts SET balance = 5000 WHERE name = 'Bob'");


        const [aliceData] = await conn2.query("SELECT balance FROM accounts WHERE name = 'Alice'");
        console.log(`Attempting to read Alice's balance from Transaction 2: ${aliceData[0].balance}`);

        await conn2.commit();
        await conn1.commit();
    } catch (error) {
        console.error(`Deadlock error: ${error.message}`);
        await conn1.rollback();
        await conn2.rollback();
    } finally {
        await conn1.end();
        await conn2.end();
    }
};

const runIsolationLevelTests = async () => {
    console.log("\nExecuting READ UNCOMMITTED Isolation Level:");
    await executeReadUncommitted();

    console.log("\nExecuting READ COMMITTED Isolation Level:");
    await executeReadCommitted();

    console.log("\nExecuting REPEATABLE READ Isolation Level:");
    await executeRepeatableRead();

    console.log("\nExecuting NON-REPEATABLE READ:");
    await executeNonRepeatableRead();

    console.log("\nSimulating DEADLOCK:");
    await simulateDeadlock();
};

runIsolationLevelTests();
