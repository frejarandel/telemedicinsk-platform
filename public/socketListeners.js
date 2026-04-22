let alreadyAnswered = false;

// on connection get all available offers
socket.on('availableOffers', offers => {
    console.log("Available offers:", offers);
    createOfferEls(offers);
});

// new offer while already connected
socket.on('newOfferAwaiting', offers => {
    console.log("New offer:", offers);
    createOfferEls(offers);
});

socket.on('answerResponse', offerObj => {
    console.log("Answer received:", offerObj);

    if (peerConnection.currentRemoteDescription) {console.log("Answer already set - ignoring");
        return; 
    }
    

    addAnswer(offerObj);
});

socket.on('receivedIceCandidateFromServer', iceCandidate => {
    console.log("ICE from server:", iceCandidate);
    addNewIceCandidate(iceCandidate);
});

function createOfferEls(offers) {
    const answerEl = document.querySelector('#answer');

    // 🔥 vigtigt: ryd gamle knapper
    answerEl.innerHTML = "";

    offers.forEach(o => {
        const btn = document.createElement('button');
        btn.className = "btn btn-success m-1";
        btn.innerText = `Answer ${o.offererUserName}`;

        btn.addEventListener('click', () => {
            alreadyAnswered = false; // reset
            answerOffer(o);
        });

        answerEl.appendChild(btn);
    });
}



/*
//on connection get all available offers and call createOfferEls
socket.on('availableOffers',offers=>{
    console.log(offers)
    createOfferEls(offers)
})

//someone just made a new offer and we're already here - call createOfferEls
socket.on('newOfferAwaiting',offers=>{
    createOfferEls(offers)
})

socket.on('answerResponse',offerObj=>{
    console.log(offerObj)
    addAnswer(offerObj)
})

socket.on('receivedIceCandidateFromServer',iceCandidate=>{
    addNewIceCandidate(iceCandidate)
    console.log(iceCandidate)
})

function createOfferEls(offers){
    //make green answer button for this new offer
    const answerEl = document.querySelector('#answer');
    offers.forEach(o=>{
        console.log(o);
        const newOfferEl = document.createElement('div');
        newOfferEl.innerHTML = `<button class="btn btn-success col-1">Answer ${o.offererUserName}</button>`
        newOfferEl.addEventListener('click',()=>answerOffer(o))
        answerEl.appendChild(newOfferEl);
    })
}*/