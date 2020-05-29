
var mysql = require('mysql')
    , cons = require('./constraints.js')

const config = cons.databaseConfig;

let pool = mysql.createPool(config);

const registered = function (email, callback) {
    connect(function (connection) {
        let sql = "SELECT * FROM peer " +
            "WHERE email = ?";
        connection.query(sql, email, function (err, results, fields) {
            if (err) {
                console.log("Failed to query whether " + email + " has registered");
                disconnect(connection);
                throw err;
            }

            disconnect(connection);
            callback(results.length !== 0);
        })
    });
}

const UUIDExists = function (UUID, callback) {
    connect(function (connection) {
        let sql = "SELECT * FROM peer " +
            "WHERE UUID = ?";
        connection.query(sql, UUID, function (err, results, fields) {
            if (err) {
                console.log("Failed to query whether " + UUID + " exists");
                disconnect(connection);
                throw err;
            }

            disconnect(connection);
            callback(results.length !== 0);
        })
    });
}

const verifyUUID = function (pid, UUID, callback) {
    connect(function (connection) {
        let sql = "SELECT UUID FROM peer " +
            "WHERE id = ? ";

        connection.query(sql, pid, function (err, results, fields) {
            if (err) {
                console.log("Failed to load UUID for:" + pid + "\nerr: " + err);
                disconnect(connection);
                callback(err);
                return;
            }

            console.log("Successfully load UUID of " + pid);
            disconnect(connection);
            callback(results[0] && results[0].UUID && results[0].UUID == UUID);
        });
    });
};

const insertPeer = function(peer, callback, failureCallback) {
    connect(function (connection) {
        let sql = "INSERT INTO PEER(name, email, UUID) VALUES(?, ?, ?)";
        connection.query(sql, peer, function(err, results, fields){
            if (err){
                console.log("Failed to insert new peer:" + peer + "\nerr: " + err);
                disconnect(connection);
                failureCallback(err.toString());
                return;
            }

            console.log("Successfully add new peer with pid: " + results.insertId +", email: " + peer[1]);
            disconnect(connection);

            callback(results.insertId);
        });
    });
};

const deletePeer = function(pid) {
    connect(function (connection) {
        let sql = "DELETE FROM PEER where id=" + pid;
        connection.query(sql, (err, result) => {
            if (err){
                console.log('failed to remove ' + pid + err.message);
                disconnect(connection);
                return;
            }

            console.log("Successfully removed " + pid);
        })
        disconnect(connection);
    });
};

const updateName = function(pid, newName) {
    connect(function (connection) {
        let sql = "UPDATE Peer SET name=? WHERE id=?";
        let params = [newName, pid];
        connection.query(sql, params,  (err, result) => {
            if (err){
                console.log('Failed to update name ' + name + err.message);
                disconnect(connection);
                return;
            }

            console.log("Successfully updated " + name);
        })
        disconnect(connection);
    });
};

module.exports.registered = registered;
module.exports.UUIDExists = UUIDExists;
module.exports.verifyUUID = verifyUUID;
module.exports.insertPeer = insertPeer;
module.exports.deletePeer = deletePeer;
module.exports.updateName = updateName;

function connect(query) {
    return pool.getConnection((err, connection) => {
        if (err) {
            console.log("Failed to connect to database, err: " + err);
            throw err;
        } else {
            query(connection);
        }
    });
}

function disconnect(connection) {
   connection.release();
}

function generatePid(email) {
    console.log("Generating pid for email: " + email);
    let string = email.copy;
    let padding;
    let len = email.length;
    let n = len / cons.pidLength;
    if (n * cons.pidLength !== len) {
        padding = (n+1) * cons.pidLength - len;
    }

    for (let i=0;i<padding;i++) {
        string += '0';
    }

    let res = "";
    for (let i=0;i<cons.pidLength;i++) {
        let num = 0;
        for (let j=0;j<=n;j++) {
            num += email.charAt(n*j + i);
        }

        while (num > 9) {
            let tmp = 0;
            while (rse !== 0) {
                tmp += num%10;
                num = num/10;
            }
            num = tmp;
        }
        res += num;
    }
    console.log("Generated pid: " + res);
}