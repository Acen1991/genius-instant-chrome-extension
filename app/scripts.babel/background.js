'use strict';


chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.browserAction.onClicked.addListener(tab => {
	chrome.tabs.query({active: true, currentWindow: true}, tabs => {
		chrome.tabs.sendMessage(tabs[0].id, {
			action: "fetchSong" 
		}, response => {
			if(response && response.action == "sendSong" && response.song && typeof response.song === "string"){
				const normalizedYoutubeTitle = encodeURIComponent(normalize(response.song));
				const access_token = "__REPLACE__";

				fetch(`https://api.genius.com/search?access_token=${access_token}&q=${normalizedYoutubeTitle}`)
				.then(response => {
					response.json().then(res => {
						if(res && res.response && res.response.hits && res.response.hits.length > 0){
					    	let mostSuitableHit = mostSuitableGeniusSong(normalizedYoutubeTitle, res.response.hits);
                            let action_url = mostSuitableHit.url;
					    	chrome.tabs.create({ url: action_url });	
					    }					
					});
				})
                .catch(err => {  
				    console.log('Fetch Error :-S', err);  
				});
			}
		});
	});
});

//@FIXME : Can always be improved !
function normalize(token) {
    let normalizedToken = token.toLowerCase();
    const pointlessWords = /(\[|\().*(\)|\])/i;

    normalizedToken = normalizedToken.replace(pointlessWords, '');
    normalizedToken = normalizedToken.replace(/\s+/, ' ');
    normalizedToken = normalizedToken.trim();

    //Removing all featurings
    const beforeDashFeaturings =  normalizedToken.match(/((ft\.|feat\.|featuring|\sfeat\s)[^\-]*\s)-\s/);
    normalizedToken = (beforeDashFeaturings && beforeDashFeaturings.length > 1 ) ? normalizedToken.replace(beforeDashFeaturings[1], '') : normalizedToken;

    const afterDashFeaturings = normalizedToken.match(/-[\w\W]*(\s?(ft\.|feat\.|featuring|\sfeat\s)[\w\W]*)/);
    normalizedToken = (afterDashFeaturings && afterDashFeaturings.length > 1) ? normalizedToken.replace(afterDashFeaturings[1], '') : normalizedToken;

    const otherDashElements = normalizedToken.match(/[\w\W]+ - [\w\W]+ (- [\w\W]+)/);
    normalizedToken = (otherDashElements && otherDashElements.length>1) ? normalizedToken.replace(otherDashElements[1], '') : normalizedToken;

    normalizedToken = normalizedToken.replace(/[\"\«\»]/g, ' ');

    normalizedToken = normalizedToken.replace(/\s\s+/g, ' ');
    
    normalizedToken = normalizedToken.trim();

    console.log(`before normalization : ${token}, after normalization : ${normalizedToken}`);
    
    return normalizedToken;
}

function mostSuitableGeniusSong(youtubeTitle, geniusSongs) {
    let iMinLev = 0;
    let minLev = Number.MAX_SAFE_INTEGER;

    for (let i = 0, songsLength = geniusSongs.length; i < songsLength; i++) {
    	let currGeniusSong = geniusSongs[i];
    	
    	if(currGeniusSong && currGeniusSong.result){
	    	const result = currGeniusSong.result;
	    	
	    	if(result && result.primary_artist && result.primary_artist.name && result.title){
		    	const geniusSongNormalized = normalize(result.primary_artist.name + " " + result.title);
		        const currentLev = LevenshteinDistance(youtubeTitle, geniusSongNormalized);
		
		        if (currentLev < minLev) {
		            minLev = currentLev;
		            iMinLev = i;
		        }	
	    	}
    	}
    }

    return geniusSongs[iMinLev] && geniusSongs[iMinLev].result;
}


function LevenshteinDistance (source, target, options) {
    options = options || {};
    if(isNaN(options.insertion_cost)) options.insertion_cost = 1;
    if(isNaN(options.deletion_cost)) options.deletion_cost = 1;
    if(isNaN(options.substitution_cost)) options.substitution_cost = 1;

    var sourceLength = source.length;
    var targetLength = target.length;
    var distanceMatrix = [[0]];

    for (var row =  1; row <= sourceLength; row++) {
        distanceMatrix[row] = [];
        distanceMatrix[row][0] = distanceMatrix[row-1][0] + options.deletion_cost;
    }

    for (var column = 1; column <= targetLength; column++) {
        distanceMatrix[0][column] = distanceMatrix[0][column-1] + options.insertion_cost;
    }

    for (var row = 1; row <= sourceLength; row++) {
        for (var column = 1; column <= targetLength; column++) {
            var costToInsert = distanceMatrix[row][column-1] + options.insertion_cost;
            var costToDelete = distanceMatrix[row-1][column] + options.deletion_cost;

            var sourceElement = source[row-1];
            var targetElement = target[column-1];
            var costToSubstitute = distanceMatrix[row-1][column-1];
            if (sourceElement !== targetElement) {
                costToSubstitute = costToSubstitute + options.substitution_cost;
            }
            distanceMatrix[row][column] = Math.min(costToInsert, costToDelete, costToSubstitute);
        }
    }
    return distanceMatrix[sourceLength][targetLength];
}
