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
		    for (var i = 0; i < mSockets.length; i++) {
                var otherClient = mSockets[i];
                if (client.id != otherClient.id) {
                    otherClient.emit('init',  {
                        fromTid: client.id,
                        fromPid: message.pid,
                        name: message.name
                    });
                    console.log("send init to " + otherClient.id);
                }
		    }
		    console.log('--- ' + message.pid + ' init, name: ' + message.name + ",tid: " + client.id + " ---");
		}else{
            // If have not registered
            db.insertNewPeer([0, client.id, message.name], function(pid){
                client.pid = pid;
                for (var i = 0; i < mSockets.length; i++) {
                    var otherClient = mSockets[i];
                    if (client.id != otherClient.id) {
                        otherClient.emit('init',  {
                            fromTid: client.id,
                            fromPid: pid,
                            name: message.name
                        });
                        console.log("send init to " + otherClient.id);
                    }
                }
                client.emit("pid", pid);
                console.log('--- ' + pid + ' init, name: ' + message.name + ",tid: " + client.id + " ---");
            });
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

    function leave() {
      console.log('-- ' + client.id + ' left --');
      var index = 0;
      while (index < mSockets.length && mSockets[index].id != client.id) {
          index++;
      }
      mSockets.splice(index, 1);
    }

	client.on('init', onReceiveInit);
    client.on('message', onReceiveMessage);
    client.on('disconnect', leave);
    client.on('leave', leave);
  });
};