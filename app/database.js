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


    }
};

