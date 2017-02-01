'use strict';


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse){
	if(request.action == "fetchSong"){
		let songTitleDOM = document.getElementById("eow-title");
		let song;
		
		if(songTitleDOM != null){
			song = songTitleDOM.innerText;
		}		
		
		sendResponse({
			action: "sendSong",
			song : song 
		});
	}
});
