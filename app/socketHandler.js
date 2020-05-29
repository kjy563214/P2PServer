module.exports = function(io, db) {

    let mSockets = new Map();

    io.on('connection', function (client) {
        if (io.engine.clientsCount > 200000) {
            client.emit("conLimit", { message: 'reach the limit of connections' })
            client.disconnect()
            console.log('Disconnected...')
            return;
        }

        function fail(message) {
            client.emit("fail", {
                message: message
            });
        }

        console.log('-- ' + client.id + ' joined --');

        client.emit("id", client.id);

        function onSignUp(message) {
            try {
                if (message.name == null || message.email == null || message.UUID == null) {
                    fail("Lack necessary attributes to register.");
                    return;
                }
                db.registered(message.email, function (registered) {
                    if (registered) {
                        console.log("Email: " + message.email + " has been registered");
                        fail("Email has been registered, please login");
                    } else {
                        db.UUIDExists(message.UUID, function (exists) {
                            if (exists) {
                                console.log("UUID:: " + message.UUID + " already exists");
                                fail("UUID exists");
                            } else {
                                if (message.name.length > 15) {
                                    fail("Name too long");
                                    return;
                                }
                                if (message.email.length > 50) {
                                    fail("Email too long");
                                    return;
                                }
                                db.insertPeer([message.name, message.email, message.UUID], function (genPid) {
                                    client.emit("signedUp", {
                                        pid: genPid,
                                        UUID: message.UUID
                                    });

                                    //client.emit("peers", getPeerList());

                                    client.pid = genPid + "";
                                    client.name = message.name;
                                    mSockets.set(client.pid, client);
                                }, fail);
                            }
                        })
                    }
                });
            } catch (e) {
                fail("Error during querying")
            }
        }

        function onLogin(message) {
            if (message.pid == null || message.email == null || message.UUID == null) {
                fail("Lack necessary attributes to register.");
                return;
            }
            console.log("Receive login request from " + message.pid);
            db.registered(message.email, function (registered) {
                if (!registered) {
                    console.log("Email " + message.email + " is not registered");
                    client.emit("fail", {
                        message: "Fail to login, account does not exist"
                    });
                } else {
                    db.verifyUUID(message.pid, message.UUID, function (valid, err) {
                        if (err) {
                            console.log("Error during verifyUUID: " + e);
                            fail("Error in server");
                        }
                        if (!valid) {
                            console.log("Fail to login for " + message.pid + ":" + message.email + ". UUID not match");
                            fail("Fail to login, UUID not match, did you change your device or reinstalled the application?");
                        } else {

                            console.log("User " + message.pid + " verified. UUID valid.");
                            client.pid = message.pid + "";
                            client.name = message.name;
                            mSockets.set(client.pid, client);

                            client.emit("loggedIn", {
                                tid: client.id
                            });
                        }
                    })
                }
            });

        }

        // function onReceiveInit(message){
        //     // If have been registered
        //     if (!db.registered(message.pid)) {
        //         const genPid = db.insertPeer([0, client.id, message.name, message.email]);
        //
        //             client.pid = pid + "";
        //             client.name = message.name;
        //             client.email = message.email;
        //             mSockets.set(client.pid, client);
        //
        //             let obj = Object.create(null);
        //             for (var [key, value] of mSockets) {
        //                 obj[key] = value.name;
        //                 console.log(key + "=" + value.name);
        //             }
        //
        //             client.emit("pid", pid);
        //             console.log('--- ' + pid + ' init, name: ' + message.name + ",tid: " + client.id + " ---");
        //             for (var [pid, peer] of mSockets){
        //                 console.log("send " + JSON.stringify(obj) +　" to " + peer.name);
        //                 peer.emit("peers", JSON.stringify(obj));
        //             }
        //         });
        //     }
        //
        //     if (db.registered(message.pid)) {
        //         if (!db.verifyUUID(message.pid, message.UUID)) {
        //             console.log("Detect device change of " + message.pid);
        //         }
        //         // TODO check info
        //         client.pid = message.pid + "";
        //         client.name = message.name;
        //         mSockets.set(client.pid, client);
        //
        //         let obj = Object.create(null);
        //         for (var [key, value] of mSockets) {
        //             obj[key] = value.name;
        //             console.log(key + "=" + value.name);
        //         }
        //
        //         for (var [pid, peer] of mSockets){
        //             console.log("send " + JSON.stringify(obj) +　" to " + peer.name);
        //             peer.emit("peers", JSON.stringify(obj));
        //         }
        //
        //         console.log('--- ' + message.pid + ' init, name: ' + message.name + ",tid: " + client.id + " ---");
        //     } else {
        //
        //     }
        // }

        function getPeerList() {
            let obj = Object.create(null);
            for (var [key, value] of mSockets) {
                obj[key] = value.name;
            }

            return JSON.stringify(obj);
        }

        function onReceiveFetchPeerList(message) {
            console.log("Receive fetch peer list, send all peer list to " + client.id + "." + client.name);

            client.emit("peers", getPeerList());
        }

        function onReceiveConnectWithPeer(message) {

            var target = mSockets.get(message.toPid);
            console.log("Receive fetch request from " + message.fromPid + " to " + message.toPid + target + " isCustomer? " + message.isCustomer);
            if (target) {
                target.emit('fetch', {
                    fromTid: client.id,
                    fromPid: message.fromPid,
                    fromName: message.fromName,
                    isCustomer: message.isCustomer
                });
                console.log("send connect request to " + target.id + " . " + target.name);
            }
        }

        function onReceiveMessage(message) {
            console.log('-- ' + client.id + ' message --' + JSON.stringify(message));

            var target = mSockets.get(message.to);
            target = io.sockets.connected[target.id];

            if (!target) {
                return;
            }

            target.emit('message', message);
        }

        function onReceiveNotifyByEmail(message) {
            var target = mSockets.get(message.toPid + "");
            console.log("receive notify request from " + message.fromPid + " to " + message.toPid
                + " content: " + message.content);
            if (target)
                console.log("Send email to " + target.email);
        }

        function onReceiveChangeName(message) {
            db.updateName(message.fromPid, message.newName);
            client.emit("success", {
                operation: "changeName",
                newName: message.newName
            });
            client.name = message.newName;
        }

        function onReceiveDestroy(message) {
            db.deletePeer(message.fromPid);
            client.emit("success", {
                operation: "destroyAccount",
            });
            mSockets.delete(message.fromPid);
        }

        function leave() {
            console.log('-- ' + client.id + ' left --');
            mSockets.delete(client.pid);
            delete client;
        }

        client.on('signUp', onSignUp);
        client.on('login', onLogin);

        client.on('connectWithPeer', onReceiveConnectWithPeer);
        client.on('fetchPeerList', onReceiveFetchPeerList);
        client.on('message', onReceiveMessage);

        client.on("notifyByEmail", onReceiveNotifyByEmail);

        client.on("changeName", onReceiveChangeName);
        client.on("destroy", onReceiveDestroy);

        client.on('disconnect', leave);
        client.on('leave', leave);
    });
};
