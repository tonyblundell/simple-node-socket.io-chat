// Load dependencies and start the server
var app = require("express").createServer().listen(1337);
var io = require("socket.io").listen(app);
var fs = require("fs");


// Global list of currently connected clients
var clients = []


/*
    Handle requests for the index page, send the HTML straight from disk
    --------------------------------------------------------------------
*/
app.get("/", function(request, response) {
    fs.readFile(__dirname + "/client.html", "utf8", function(err, text){
        response.end(text);
    });
});


/*
    Handle connections via socket.io
    --------------------------------
*/
io.sockets.on("connection", function(socket) {

    /*
        Handle requests to join the chat-room
        -------------------------------------
    */
    socket.on('join', function(nick, callback) {

        // If the nickname isn't in use, join the user
        if (clients.indexOf(nick) < 0) {
            // Store the nickname, we'll use it when sending messages
            socket.nick = nick;
            // Add the nickname to the global list
            clients.push(nick);
            // Send a message to all clients that a new user has joined
            socket.broadcast.emit("user-joined", nick);
            // Send the client a welcome message
            socket.emit("system-message", "Welcome to the chat room!")
            // Callback to the user with a successful flag and the list of clients
            callback(true, clients);

        // If the nickname is already in use, reject the request to join
        } else {
            // Notify the client via callback that the request was unsuccessful
            callback(false);
        }
    });

    
    /*
        Handle chat messages
        --------------------
    */
    socket.on("chat", function(message) {
        // Check that the client has already joined successfully,
        // and that the message isn't just an empty string,
        // then foward the message to all clients
        if (socket.nick && message) {
            io.sockets.emit("chat", {sender: socket.nick, message: message});
        }
    });


    /*
        Handle client disconnection
        ---------------------------
    */
    socket.on("disconnect", function() {
        // Check that the user has already joined successfully
        if (socket.nick) {
            // Remove the client from the global list
            clients.splice(clients.indexOf(socket.nick), 1);
            // Let all the remaining clients know of the disconnect
            io.sockets.emit("user-left", socket.nick);
        }
    });

});