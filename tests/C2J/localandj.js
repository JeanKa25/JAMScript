
jasync function me(s) {
    console.log("Me - Message from C ", s);
}

jasync function you(s) {
    console.log("You - Message from C ", s);
}


var count = 10;
setInterval(function() {
    console.log("This is just a local print...");
}, 300);
