const idLength = 6;

module.exports = function(io, db) {

  var mSockets = new Map();

  io.on('connection', function(client) {
    console.log('-- ' + client.id + ' joined --');

    client.emit("id", client.id);

	function onReceiveInit(message){
		// If have been registered
		if (message.pid != 0){
		    client.pid = message.pid;
		    client.name = message.name;
            mSockets.set(message.pid, client);

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
            db.insertNewPeer([0, client.id, message.name], function(pid){
                client.pid = pid;
                client.name = message.name;
                mSockets.set(pid, client);

                let obj = Object.create(null);
                for (var [key, value] of mSockets) {
                  obj[key] = value.name;
                  console.log(key + "=" + value.name);
                }

               for (var [pid, peer] of mSockets){
                    console.log("send " + JSON.stringify(obj) +　" to " + peer.name);
                    peer.emit("peers", JSON.stringify(obj));
                }

                client.emit("pid", pid);
                console.log('--- ' + pid + ' init, name: ' + message.name + ",tid: " + client.id + " ---");
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

	function onReceiveFetch(message){
	    console.log("Receive fetch request: " + message);

        var target = mSockets.get(message.toPid);
        target.emit('fetch',  {
            fromTid: client.id,
            fromPid: message.fromPid,
            fromName: message.fromName
        });
        console.log("send init to " + target.id);
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
        msockets.delete(message.fromPid);
    }

    function leave() {
      console.log('-- ' + client.id + ' left --');
      mSockets.delete(client.pid);
    }

	client.on('init', onReceiveInit);
	client.on('fetch', onReceiveFetch);
	client.on('fetchPeerList', onReceiveFetchPeerList);
    client.on('message', onReceiveMessage);

    client.on("changeName", onReceiveChangeName);
    client.on("destroy", onReceiveDestroy);

    client.on('disconnect', leave);
    client.on('leave', leave);
  });
};