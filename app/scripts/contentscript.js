'use strict';

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action == "fetchSong") {
		var song = document.getElementById("eow-title").innerText;

		sendResponse({
			action: "sendSong",
			song: song
		});
	}
});
//# sourceMappingURL=contentscript.js.map
