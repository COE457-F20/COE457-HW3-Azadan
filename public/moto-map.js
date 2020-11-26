var destinationCoords = null;
var currentCoords = null;

var map;
var dir;

var currentLayer;
var currentMarker, destMarker;

var remember;
var currEmail;

var wsbroker = "localhost"; //mqtt websocket enabled broker
var wsport = 9001 // port for above
var client = new Paho.MQTT.Client(wsbroker, wsport, "myclientid_" + parseInt(Math.random() * 100, 10));




window.onload = function () {
    getSessionInfo();
    init();

    map = L.map('map', {
        layers: MQ.mapLayer(),
        center: [38.895345, -77.030101],
        zoom: 10
    });

    dir = MQ.routing.directions();

    map.locate({
        setView: true,
        maxZoom: 10,
        watch: true
    });


    map.on('locationfound', function (e) {

        if (currentMarker == null) {
            currentMarker = new L.Marker(e.latlng);
            currentMarker.bindPopup("Current Location").openPopup();
            map.addLayer(currentMarker);
        }
        else {
            currentMarker.setLatLng(e.latlng);
        }

        currentCoords = e.latlng;
        if (destinationCoords != null) {
            updateRoute();
        }

    });

    map.on('click', function (e) {
        //alert("Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng)

        destinationCoords = e.latlng;

        if (destMarker == null) {
            destMarker = new L.Marker(e.latlng);
            destMarker.bindPopup("Destination").openPopup();
            map.addLayer(destMarker);
        }
        else {
            destMarker.setLatLng(e.latlng);
        }

        updateRoute();
    });
}

function updateRoute() {
    if (currentLayer != null && map.hasLayer(currentLayer)) {
        map.removeLayer(currentLayer);
    }
    dir.route({
        locations: [
            { latLng: currentCoords },
            { latLng: destinationCoords }
        ]
    });
    currentLayer = MQ.routing.routeLayer({
        directions: dir,
        fitBounds: true
    });
    map.addLayer(currentLayer);

    // $.post("http://localhost:8080",
    //     JSON.stringify({
    //         coords_starting: currentCoords,
    //         coords_destination: destinationCoords,
    //     }), null);

    message = new Paho.MQTT.Message(JSON.stringify({
        email: currEmail,
        coords_starting: currentCoords,
        coords_destination: destinationCoords,
    }));
    message.destinationName = "iothw3/coords";
    client.send(message);

}


function getSessionInfo() {
    $.get("http://localhost:1234/get_session_info", function (data) {
        var currentUserInfo = data;
        console.log("received: " + JSON.stringify(currentUserInfo));

        //even without cookie consent, we store their email for essential function
        if (!currentUserInfo.email) {
            window.location.href = 'error.html';
        }
        else {
            //will be null without cookie consent
            if (currentUserInfo.firstLogin) {
                $("#welcome_msg").text(currentUserInfo.username);
            }
            else {
                if (currentUserInfo.username){
                    $("#welcome_msg").text("Welcome back " + currentUserInfo.username);
                    $("#time_msg").text("Last visited: " + currentUserInfo.visitTime);    
                }

            }
            remember = currentUserInfo.remember;
            currEmail = currentUserInfo.email;
        }

    });
}


window.addEventListener("beforeunload", function (e) {
    if (!remember) {
        $.get("http://localhost:1234/logout_user", function (data) {

        });
    }

});


//MQTT Below
client.onConnectionLost = function (responseObject) {
    console.log("connection lost: " + responseObject.errorMessage);
};

var options = {
    timeout: 3,
    onSuccess: function () {
        console.log("mqtt connected");

    },
    onFailure: function (message) {
        console.log("Connection failed: " + message.errorMessage);
    }
};

function init() {
    client.connect(options);
}