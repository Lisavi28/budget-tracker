//to hold db connection
let db;
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
//database created successfully, it is saved in the global variable.
    db = event.target.result;
    if (navigator.onLine) {
        uploadTransaction()
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const  budgetObjectStore = transaction.objectStore('new_transaction');

    // add record to your store with add method
    budgetObjectStore.add(record);
}

function uploadTransaction() {
    // open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    // access your object store
    const budgetObjectStore = transaction.objectStore('new_transaction');
    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();
    getAll.onsuccess = function() {

        // if there was data in indexedDb's store send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
    .then(response => response.json())
    .then(serverResponse => {
        if (serverResponse.message) {
            throw new Error(serverResponse);
            }

        // open new transaction
        const transaction = db.transaction(['new_transaction'], 'readwrite');
        // access the new_transaction object store
        const budgetObjectStore = transaction.objectStore('new_transaction');
        // clear all items in your store
        budgetObjectStore.clear();

                alert('Pending transactions have been submitted');
            })
            .catch(err => {
                console.log(err);
            });          
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);