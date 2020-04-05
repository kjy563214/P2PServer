const idLength = 6;

module.exports = function(io, db) {

  var mSockets = new Map();

  io.on('connection', function(client) {
    console.log('-- ' + client.id + ' joined --');

    client.emit("id", client.id);

	function onReceiveInit(message){
		// If have been registered
		if (message.pid != 0){
		    client.pid = message.pid + "";
		    client.name = message.name;
        mSockets.set(client.pid, client);

		    let obj = Object.create(null);
            for (var [key, value] of mSockets) {
                obj[key] = value.name;
                console.log(key + "=" + value.name);
            }

            for (var [pid, peer] of mSockets){
                console.log("send " + JSON.stringify(obj) +　" to " + peer.name);
                peer.emit("peers", JSON.stringify(obj));
            }

		    console.log('--- ' + message.pid + ' init, name: ' + message.name + ",tid: " + client.id + " ---");

		}else{
            // If have not registered
            db.insertNewPeer([0, client.id, message.name, message.email], function(pid){
                client.pid = pid + "";
                client.name = message.name;
                client.email = message.email;
                mSockets.set(client.pid, client);

                let obj = Object.create(null);
                for (var [key, value] of mSockets) {
                  obj[key] = value.name;
                  console.log(key + "=" + value.name);
                }

                client.emit("pid", pid);
                console.log('--- ' + pid + ' init, name: ' + message.name + ",tid: " + client.id + " ---");
               for (var [pid, peer] of mSockets){
                    console.log("send " + JSON.stringify(obj) +　" to " + peer.name);
                    peer.emit("peers", JSON.stringify(obj));
                }
            });
		}
	}

	function onReceiveFetchPeerList(message) {
	    console.log("Receive fetch peer list, send all peer list to " + client.id + "." + client.name);

	    let obj = Object.create(null);
        for (var [key, value] of mSockets) {
            obj[key] = value.name;
        }
        client.emit("peers", JSON.stringify(obj));
	}

	function onReceiveConnectWithPeer(message){

        var target = mSockets.get(message.toPid);
        console.log("Receive fetch request from " + message.fromPid + " to " + message.toPid + target + " isCustomer? " + message.isCustomer);
        if (target){
            target.emit('fetch',  {
                fromTid: client.id,
                fromPid: message.fromPid,
                fromName: message.fromName,
                isCustomer: message.isCustomer
            });
            console.log("send connect request to " + target.id  + " . " + target.name);
        }
	}

	function onReceiveMessage(message){
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

	function onReceiveChangeName(message){
        db.updateName(message.fromPid, message.newName);
        client.emit("success", {
            operation: "changeName",
            newName: message.newName
        });
        client.name = message.newName;
	}

    function onReceiveDestroy(message){
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

  	client.on('init', onReceiveInit);
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
