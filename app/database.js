var mysql = require('mysql')
let config = {
                 host: 'localhost',
                 user: 'root',
                 password: '123',
                 database: 'p2pdatabase'
             }

module.exports = {
    insertNewPeer: function(peer, callback) {
        let connection = mysql.createConnection(config);
        connection.connect(function (err) {
            if (err){
                console.log("Failed to connect to database, err: " + err);
            }
        });
        let sql = "INSERT INTO PEER(id, temporaryId, name) VALUES(?, ?, ?)";
        connection.query(sql, peer, function(err, results, fields){
            if (err){
                console.log("Failed to insert new peer:" + peer + "\nerr: " + err);
            }

            callback(results.insertId);
            console.log("Successfully add new peer with pid: " + results.insertId +", tid: " + peer[1]);

            connection.end(function (err){
                if (err) {
                    console.log("Failed to close connection, err: " + err);
                }
            });
        });
    },

    deletePeer: function(pid){
        let connection = mysql.createConnection(config);
        connection.connect(function (err) {
            if (err){
                console.log("Failed to connect to database, err: " + err);
            }
        });
        let sql = "DELETE FROM PEER where id=" + pid;
        connection.query(sql, (err, result) => {
            if (err){
                console.log('failed to remove ' + pid + err.message);
                return;
            }

            console.log("Successfully removed " + pid);
        })
        connection.end();
    },

    updateName: function(pid, name){
        let connection = mysql.createConnection(config);
        connection.connect(function (err) {
            if (err){
                console.log("Failed to connect to database, err: " + err);
            }
        });
        let sql = "UPDATE Peer SET name=? WHERE id=?";
        let params = [name, pid];
        connection.query(sql, params,  (err, result) => {
            if (err){
                console.log('Failed to update name ' + name + err.message);
                return;
            }

            console.log("Successfully updated " + name);
        })
        connection.end();
    }
};

