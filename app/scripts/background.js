'use strict';

chrome.runtime.onInstalled.addListener(function (details) {
    console.log('previousVersion', details.previousVersion);
});

chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "fetchSong"
        }, function (response) {
            if (response.action == "sendSong") {
                (function () {
                    var normalizedYoutubeTitle = encodeURIComponent(normalize(response.song));
                    var access_token = "OElEA-q64Qtuynf70UHumI_YqVs6MwnRlog8QTkqjM_tmsWAv0_cTIn0pdTzs3IT";

                    fetch('https://api.genius.com/search?access_token=' + access_token + '&q=' + normalizedYoutubeTitle).then(function (response) {
                        response.json().then(function (res) {
                            if (res && res.response && res.response.hits && res.response.hits.length > 0) {
                                var mostSuitableHit = mostSuitableGeniusSong(normalizedYoutubeTitle, res.response.hits);
                                var action_url = mostSuitableHit.url;
                                chrome.tabs.create({ url: action_url });
                            }
                        });
                    }).catch(function (err) {
                        console.log('Fetch Error :-S', err);
                    });
                })();
            }
        });
    });
});

//@FIXME : Can always be improved !
function normalize(token) {
    var normalizedToken = token.toLowerCase();
    var pointlessWords = /(\[|\().*(\)|\])/i;

    normalizedToken = normalizedToken.replace(pointlessWords, '');
    normalizedToken = normalizedToken.replace(/\s+/, ' ');
    normalizedToken = normalizedToken.trim();

    //Removing all featurings
    var beforeDashFeaturings = normalizedToken.match(/((ft\.|feat\.|featuring|\sfeat\s)[^\-]*\s)-\s/);
    normalizedToken = beforeDashFeaturings && beforeDashFeaturings.length > 1 ? normalizedToken.replace(beforeDashFeaturings[1], '') : normalizedToken;

    var afterDashFeaturings = normalizedToken.match(/-[\w\W]*(\s?(ft\.|feat\.|featuring|\sfeat\s)[\w\W]*)/);
    normalizedToken = afterDashFeaturings && afterDashFeaturings.length > 1 ? normalizedToken.replace(afterDashFeaturings[1], '') : normalizedToken;

    var otherDashElements = normalizedToken.match(/[\w\W]+ - [\w\W]+ (- [\w\W]+)/);
    normalizedToken = otherDashElements && otherDashElements.length > 1 ? normalizedToken.replace(otherDashElements[1], '') : normalizedToken;

    normalizedToken = normalizedToken.replace(/[\"\«\»]/g, ' ');

    normalizedToken = normalizedToken.replace(/\s\s+/g, ' ');

    normalizedToken = normalizedToken.trim();

    console.log('before normalization : ' + token + ', after normalization : ' + normalizedToken);

    return normalizedToken;
}

function mostSuitableGeniusSong(youtubeTitle, geniusSongs) {
    var iMinLev = 0;
    var minLev = Number.MAX_SAFE_INTEGER;

    for (var i = 0, songsLength = geniusSongs.length; i < songsLength; i++) {
        var result = geniusSongs[i].result;
        var geniusSongNormalized = normalize(result.primary_artist.name + " " + result.title);
        var currentLev = LevenshteinDistance(youtubeTitle, geniusSongNormalized);

        if (currentLev < minLev) {
            minLev = currentLev;
            iMinLev = i;
        }
    }

    return geniusSongs[iMinLev].result;
}

function LevenshteinDistance(source, target, options) {
    options = options || {};
    if (isNaN(options.insertion_cost)) options.insertion_cost = 1;
    if (isNaN(options.deletion_cost)) options.deletion_cost = 1;
    if (isNaN(options.substitution_cost)) options.substitution_cost = 1;

    var sourceLength = source.length;
    var targetLength = target.length;
    var distanceMatrix = [[0]];

    for (var row = 1; row <= sourceLength; row++) {
        distanceMatrix[row] = [];
        distanceMatrix[row][0] = distanceMatrix[row - 1][0] + options.deletion_cost;
    }

    for (var column = 1; column <= targetLength; column++) {
        distanceMatrix[0][column] = distanceMatrix[0][column - 1] + options.insertion_cost;
    }

    for (var row = 1; row <= sourceLength; row++) {
        for (var column = 1; column <= targetLength; column++) {
            var costToInsert = distanceMatrix[row][column - 1] + options.insertion_cost;
            var costToDelete = distanceMatrix[row - 1][column] + options.deletion_cost;

            var sourceElement = source[row - 1];
            var targetElement = target[column - 1];
            var costToSubstitute = distanceMatrix[row - 1][column - 1];
            if (sourceElement !== targetElement) {
                costToSubstitute = costToSubstitute + options.substitution_cost;
            }
            distanceMatrix[row][column] = Math.min(costToInsert, costToDelete, costToSubstitute);
        }
    }
    return distanceMatrix[sourceLength][targetLength];
}
//# sourceMappingURL=background.js.map
