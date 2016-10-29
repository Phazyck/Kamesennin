var wanikani = (function Wanikani() {

    var wk = this;

    var toPascalCase = function(word) {
        var parts = word.split("-");
        var pascalParts = parts.map(function (part) {
            var pascalPart = part.charAt(0).toUpperCase() + part.slice(1);
            return pascalPart;
        });
        var pascalWord = pascalParts.join("");

        return pascalWord;
    };

    var toCamelCase = function(word) {
        var pascalWord = toPascalCase(word);
        var camelWord = pascalWord.charAt(0).toLowerCase() + pascalWord.slice(1);
        return camelWord;
    };

    wk.srsStates = [
        "apprentice",
        "guru",
        "master",
        "enlighten",
        "burned"
    ];

    wk.resources = [
        "user-information", 
        // "study-queue", 
        // "level-progression", 
        "srs-distribution", 
        // "recent-unlocks", 
        // "critical-items",
        // "radicals", 
        "kanji", 
        "vocabulary"
    ];

    wk.debug = false;

    wk.get = function(resource, apiKey, callback) {
        var url = "https://www.wanikani.com/api/user/" + apiKey + "/" + resource,
            cachedData = localStorage[url];

        if (!!cachedData && wk.debug) {
            cachedData = JSON.parse(cachedData);
            console.log("returning cached data for", resource, "\n", cachedData);
            callback(cachedData);
            return;
        }

        return $.ajax({
            url: url,
            cache: true,
            dataType: 'jsonp',
            success: function(value) {
                localStorage[url] = JSON.stringify(value);
                callback(value);
            }
        });
    };
    
    wk.resources.forEach(function(resource) {
        var getter = "get" + toPascalCase(resource);

        wk[getter] = function(apiKey, callback) {
            return wk.get(resource, apiKey, callback);
        };
    });

    wk.getResources = function(resources, apiKey, callback) {
        var resultObj = {};

        var calls = resources.map(function (resource) {
            var camelCase = toCamelCase(resource); 
            return wk.get(resource, apiKey, function(result) {
                resultObj[camelCase] = result;
            });
        });

        $.when.apply($, calls).then(function() {
            callback(resultObj);
        });
    };

    wk.getAll = function(apiKey, callback) {
        wk.getResources(wk.resources, apiKey, callback);
    };

    return wk;
})();