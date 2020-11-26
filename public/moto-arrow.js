var wsbroker = "localhost"; //mqtt websocket enabled broker
var wsport = 9001 // port for above
// create client using the Paho library
var client = new Paho.MQTT.Client(wsbroker, wsport,
    "myclientid_" + parseInt(Math.random() * 100, 10));

client.onConnectionLost = function (responseObject) {
    console.log("connection lost: " + responseObject.errorMessage);
};
client.onMessageArrived = function (message) {
    console.log(message.destinationName, ' -- ',message.payloadString);
    if (message.destinationName == 'iothw3/coords'){

        currentCoords = JSON.parse(message.payloadString);
        var currAngle = (90 + Math.round(getAngle(currentCoords.coords_destination, currentCoords.coords_starting))) % 360;
        $("#arrow").css("transform", "rotate(" + Math.round(currAngle) + "deg)");

    }
    else if (message.destinationName == 'face/image'){
        $('#main_img').attr('src','data:image/jpeg;base64,'+message.payloadString);
    }
};
var options = {
    timeout: 3,
    onSuccess: function () {
        console.log("mqtt connected");
        client.subscribe("iothw3/coords", { qos: 2 });
    },
    onFailure: function (message) {
        console.log("Connection failed: " + message.errorMessage);
    }
};

function init() {
    client.connect(options);
}


function getAngle(start_coord, end_coord) {
    startLat = toRadians(start_coord.lat);
    startLng = toRadians(start_coord.lng);
    destLat = toRadians(end_coord.lat);
    destLng = toRadians(end_coord.lng);

    y = Math.sin(destLng - startLng) * Math.cos(destLat);
    x = Math.cos(startLat) * Math.sin(destLat) -
        Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    brng = Math.atan2(y, x);
    brng = toDegrees(brng);
    return (brng + 360) % 360;
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
};

function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

