// simple HTTP server using TCP sockets
var net = require('net');
var fs = require('fs');

var all_coords = null;

var server = net.createServer(function (socket) {

    socket.on('data', function (data) {
        console.log('Received: ' + data);
        r = data.toString();
        console.log(r);
        if (r.substring(0, 4) == "POST") {
            console.log("PARSED:");
            post_body_start = r.indexOf('{');
            post_body = r.substring(post_body_start, r.length);
            console.log(post_body);
            all_coords = JSON.parse(post_body);
        }
        else if (r.substring(0, 3) == "GET") {
            if (all_coords != null) {
                console.log("get received");
                socket.write("HTTP/1.1 200 OK\n");
                socket.write("Access-Control-Allow-Origin: *\n");
                contents = JSON.stringify(all_coords);
                socket.write("Content-Length:" + contents.length);
                socket.write("\n\n"); // two carriage returns
                socket.write(contents);
            }

        }
        socket.destroy();
    });


    socket.on('close', function () {
        console.log('Connection closed');
    });
    socket.on('end', function () {
        console.log('client disconnected');
    });

    socket.on('error', function () {
        console.log('client disconnected');
    });
});
server.listen(8080, function () {
    console.log('server is listening on port 8080');
});