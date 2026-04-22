
//const fs = require('fs');
const http = require('http') //Ændrer til http, fordi render håndterer https
const express = require('express');
const socketio = require('socket.io');
const app = express();
app.use(express.static("public"))

//we need a key and cert to run https
//we generated them with mkcert
// $ mkcert create-ca
// $ mkcert create-cert
//const key = fs.readFileSync('cert.key');
//const cert = fs.readFileSync('cert.crt');

//we changed our express setup so we can use https
//pass the key and cert to createServer on https
const expressServer = http.createServer(app); //Opretter HTTP server
//create our socket.io server... it will listen to our express port
const io = socketio(expressServer,{
    cors: {
        origin:'*' , //Alle må connecte til din server
            //"https://localhost",
            //'https://192.168.32.7' //if using a phone or another computer
        
        methods: ["GET", "POST"]
    }
});

//Bruger Render port
const PORT = process.env.PORT || 8181;

expressServer.listen(PORT,'0.0.0.0',() => {
    console.log("Server running on port " + PORT);
})

//debug hvis server crasher - nyt
process.on('uncaughtException', err => {console.error("CRASH:", err);

});

//offers will contain {}
const offers = [
    // offererUserName
    // offer
    // offerIceCandidates
    // answererUserName
    // answer
    // answererIceCandidates
];
const connectedSockets = [
    //username, socketId
]

io.on('connection',(socket)=>{
    // console.log("Someone has connected");
    const userName = socket.handshake.auth.userName;
    const password = socket.handshake.auth.password;

    if(password !== "x"){
        socket.disconnect(true);
        return;
    }
    connectedSockets.push({
        socketId: socket.id,
        userName
    })

    //a new client has joined. If there are any offers available,
    //emit them out
    if(offers.length){
        socket.emit('availableOffers',offers);
    }
    
    socket.on('newOffer',newOffer=>{
        offers.push({
            offererUserName: userName,
            offer: newOffer,
            offerIceCandidates: [],
            answererUserName: null,
            answer: null,
            answererIceCandidates: []
        })
        // console.log(newOffer.sdp.slice(50))
        //send out to all connected sockets EXCEPT the caller
        socket.broadcast.emit('newOfferAwaiting',offers.slice(-1))
    })

    
    socket.on('newAnswer', (offerObj, ackFunction) => {

        const socketToAnswer = connectedSockets.find(s => s.userName === offerObj.offererUserName);
        if (!socketToAnswer) return;

        const offerToUpdate = offers.find(o => o.offererUserName === offerObj.offererUserName);
        if (!offerToUpdate) return;

        ackFunction(offerToUpdate.offerIceCandidates);

        offerToUpdate.answer = offerObj.answer;
        offerToUpdate.answererUserName = userName;

        socket.to(socketToAnswer.socketId).emit('answerResponse', offerToUpdate);

        // Fjern offer (forhindrer duplicates)
        const index = offers.findIndex(o => o.offererUserName === offerObj.offererUserName);
        if (index !== -1) {
            offers.splice(index, 1);
        }
    });

    socket.on('sendIceCandidateToSignalingServer', iceCandidateObj => {

        const { didIOffer, iceUserName, iceCandidate } = iceCandidateObj;

        if (didIOffer) {
            const offerInOffers = offers.find(o => o.offererUserName === iceUserName);
            if (!offerInOffers) return;

            offerInOffers.offerIceCandidates.push(iceCandidate);

            if (offerInOffers.answererUserName) {
                const socketToSendTo = connectedSockets.find(s => s.userName === offerInOffers.answererUserName);
                if (socketToSendTo) {
                    socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer', iceCandidate);
                }
            }

        } else {
            const offerInOffers = offers.find(o => o.answererUserName === iceUserName);
            if (!offerInOffers) return;

            const socketToSendTo = connectedSockets.find(s => s.userName === offerInOffers.offererUserName);
            if (socketToSendTo) {
                socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer', iceCandidate);
            }
        }
    });

    socket.on('disconnect', () => {
        const index = connectedSockets.findIndex(s => s.socketId === socket.id);
        if (index !== -1) {
            connectedSockets.splice(index, 1);
        }
    });

});

