const idLength = 6;

module.exports = function(io, db) {

  var mSockets = [];

  io.on('connection', function(client) {
    console.log('-- ' + client.id + ' joined --');
    mSockets.push(client);

    client.emit("id", client.id);

	function onReceiveInit(message){
		// If have been registered
		if (message.pid != 0){
		    client.pid = message.pid;
		    client.name = message.name;

		    peers = new Map();
		    for (var i = 0;i < mSockets.length; i++){
		        var otherClient = mSockets[i];
                peers.set(otherClient.pid, otherClient.name);
		    }

		    let obj = Object.create(null);
            for (var [key, value] of peers) {
              obj[key] = value;
              console.log(key + "=" + value);
            }

            for (var i = 0;i < mSockets.length; i++){
            var otherClient = mSockets[i];
                console.log("send " + JSON.stringify(obj) +　" to " + otherClient.name);
		        otherClient.emit("peers", JSON.stringify(obj));
		    }

		    console.log('--- ' + message.pid + ' init, name: ' + message.name + ",tid: " + client.id + " ---");


		}else{
            // If have not registered
            db.insertNewPeer([0, client.id, message.name], function(pid){
                client.pid = pid;
                client.name = message.name;

                peers = new Map();
                for (var i = 0;i < mSockets.length; i++){
                    var otherClient = mSockets[i];
                    peers.set(otherClient.pid, otherClient.name);
                }

                let obj = Object.create(null);
                for (var [key, value] of peers) {
                  obj[key] = value;
                  console.log(key + "=" + value);
                }

                for (var i = 0;i < mSockets.length; i++){
                var otherClient = mSockets[i];
                    console.log("send " + JSON.stringify(obj) +　" to " + otherClient.name);
                    otherClient.emit("peers", JSON.stringify(obj));
                }

                client.emit("pid", pid);
                console.log('--- ' + pid + ' init, name: ' + message.name + ",tid: " + client.id + " ---");
            });
		}
	}

	function onReceiveFetchPeerList(message) {
	    console.log("Receive fetch peer list, send all peer list to " + client.id + "." + client.name);
	    peers = new Map();
        for (var i = 0;i < mSockets.length; i++){
            var otherClient = mSockets[i];
            peers.set(otherClient.pid, otherClient.name);
        }
	    let obj = Object.create(null);
        for (var [key, value] of peers) {
          obj[key] = value;
        }
        client.emit("peers", JSON.stringify(obj));
	}

	function onReceiveFetch(message){
	    console.log("Receive fetch request: " + message);
	    for (var i = 0; i < mSockets.length; i++) {
            var otherClient = mSockets[i];
            console.log("Comapre " + otherClient.pid + " with " + message.toPid);
            if (otherClient.pid == message.toPid) {
                otherClient.emit('fetch',  {
                    fromTid: client.id,
                    fromPid: message.fromPid,
                    fromName: message.fromName
                });
                console.log("send init to " + otherClient.id);
                break;
            }
        }
	}

	function onReceiveMessage(message){
        console.log('-- ' + client.id + ' message --' + JSON.stringify(message));

        for (var i = 0; i < mSockets.length; i++) {
            var otherClient;
            if (message.to == mSockets[i].pid) {

               otherClient = io.sockets.connected[mSockets[i].id];
               break;
            }
        }

        if (!otherClient) {
            return;
        }
        delete message.to;

        otherClient.emit('message', message);
	}

	function onReceiveChangeName(message){
        db.updateName(message.fromPid, message.newName);
        client.emit("success", {
            operation: "changeName",
            newName: message.newName
        });
	}

    function onReceiveDestroy(message){
        db.deletePeer(message.fromPid);
        client.emit("success", {
            operation: "destroyAccount",
        });
    }

    function leave() {
      console.log('-- ' + client.id + ' left --');
      var index = 0;
      while (index < mSockets.length && mSockets[index].id != client.id) {
          index++;
      }
      mSockets.splice(index, 1);
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