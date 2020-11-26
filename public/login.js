var cookieConsent = false;

function getSessionInfo() {
    $.get("http://localhost:1234/get_session_info", function (data) {
        var currentUserInfo = data;
        console.log("received: " + JSON.stringify(currentUserInfo));

        if (currentUserInfo.remember) {
            window.location.href = 'moto-map.html';
        }
    });
}

function onLoginClick() {
    $.ajax({
        url: "http://localhost:1234/login_user",
        type: "post", //send it through get method
        data: {
            email: $('#email').val(),
            password: $('#password').val(),
            remember: $('#remember').is(':checked'),
            consent: cookieConsent,
        },
        success: function (response) {
            console.log("success");
            //Do Something
            if (response.toString() == 'login_error'){
                $('#mainCol').prepend('<div id="loginFail" class="alert alert-danger" role="alert">Login Failed! Invalid Credentials</div>');
            }
            else{
                window.location.href = 'moto-map.html';
            }
        },
        error: function (xhr) {
            //Do Something to handle error
            console.log("error");

        }
    });
}

function onAcceptClick(){
    $('#consentNav').hide();
    cookieConsent = true;
}

function onDeclineClick(){
    $('#consentNav').hide();
}