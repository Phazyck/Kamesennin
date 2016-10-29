var viewModel = (function() {
    var vm = {};

    function extractUserInformation(data) {
        var userInformation = data.userInformation.user_information,
            parsedInformation = [],
            push = function(property, value) {
                parsedInformation.push({
                    property: property,
                    value: value
                });
            },
            parseNumber = function(property, name, minimumValue) {
                var value = userInformation[property];
                if(value >= minimumValue) {
                    push(name || property, value);
                }
            },
            parseString = function(property, name) {
                var value = userInformation[property];
                if(!!value && value.length > 0) {
                    push(name || property, value);
                }
            },
            parseDate = function(property, name) {
                var value = userInformation[property];
                if(!!value) {
                    push(name || property, (new Date(value * 1000)).toLocaleDateString());
                }
            };

        parseString("username");
        parseNumber("level", "level", 0);
        parseString("title");
        parseString("about");
        parseString("website");
        parseString("twitter");
        parseNumber("topics_count", "topics", 1);
        parseNumber("posts_count", "posts", 1);
        parseDate("creation_date", "created");
        parseDate("vacation_date", "vacation");
        
        return parsedInformation;
    }

    function extractGravatar(data) {
        var userInformation = data.userInformation.user_information,
            gravatar = "http://www.gravatar.com/avatar/" + userInformation.gravatar;

        return gravatar;
    }

    function extractStates(data, type) {
        var enabled = {},
            chosen = [],
            state;

        data = data.srsDistribution.requested_information;

        for(state in data) {
            enabled[state] = data[state][type] > 0;
            if (enabled[state]) {
                chosen.push(state);
            }
            
        }

        return {
            enabled: enabled,
            chosen: ko.observableArray(chosen)
        };
    }

    function extractCharacters(data, target) {
        var values,
            states = extractStates(data, target);

        values = 
            data[target].requested_information.general ||
            data[target].requested_information;

        values = values.filter(function(element) {
            return !!element.user_specific;
        });

        values = values.sort(function(a,b) {
            if(a.level < b.level) {
                return -1;
            }

            if(a.level > b.level) {
                return 1;
            }

            return a.meaning.localeCompare(b.meaning);
        });

        values = values.map(function(element) {
            var level,
                character,
                meaning,
                meaningRaw,
                kana,
                kanaRaw,
                state,
                urlWanikani,
                urlJisho,
                disabled;

            level = element.level;

            character = element.character;

            meaning = element.meaning;
            meaningRaw = meaning;
            meaning = meaning.split(", ").join("\n");

            kana = element.kana || element[element.important_reading];
            kanaRaw = kana;
            kana = kana.split(", ").join("\n");
            
            state = element.user_specific.srs;

            urlWanikani = "https://www.wanikani.com/" + target + "/" + character;

            urlJisho = "http://jisho.org/";

            disabled = ko.computed(function() {
                return !vm.chosenStates()[state];
            });

            if(target === "kanji") {
                urlJisho += "search/" + character + "%20%23kanji";
            }
            else if (target === "vocabulary") {
                urlJisho += "word/" + character;
            }

            return {
                level: level,
                character: character,
                meaning: meaning,
                meaningRaw: meaningRaw,
                kana: kana,
                kanaRaw: kanaRaw,
                state: state,
                urlWanikani: urlWanikani,
                urlJisho: urlJisho,
                disabled: disabled
            };
        });

        return {
            values: values,
            states: states
        };
    }

    function extractData(data) {
        return {
            gravatar: extractGravatar(data),
            userInformation: extractUserInformation(data),
            kanji: extractCharacters(data, "kanji"),
            vocabulary: extractCharacters(data, "vocabulary")
        };
    }

    vm.states = wanikani.srsStates;

    vm.apiKey = ko.observable();

    vm.data = ko.observable();

    vm.isLoading = ko.observable(false);

    vm.chosenType = ko.observable("kanji");

    vm.currentData = ko.computed(function() {
        var data = vm.data();

        return !!data && data[vm.chosenType()];
    });

    vm.chosenStates = ko.computed(function() {
        var chosenStates = {};

        if(!vm.currentData || !vm.currentData()) {
            return chosenStates;
        }

        vm.currentData().states.chosen().forEach(function(state) {
            chosenStates[state] = true;
        });

        return chosenStates;

    })

    vm.loadData = function() {
        var key = vm.apiKey();
        
        if(!!key && key.length > 0) {
            window.location = "#" + key;

            vm.isLoading(true);

            wanikani.getAll(key, function(data) {
                
                vm.isLoading(false);

                if(!!data.userInformation.error) {
                    vm.data(null);
                    return;
                }

                vm.data(extractData(data));
            });
        } else {
            window.location = "";
        }
    };

    vm.clear = function() {
        vm.apiKey("");
        window.location = "";
    }

    vm.exportData = function() {
        var a = window.document.createElement('a'),
            data = vm.currentData().values;

        
        data = data.filter(function(element) {
           return !element.disabled(); 
        });

        data = data.map(function(element) {
            return [
                JSON.stringify("level " + element.level + " | " + element.meaningRaw + " | " + element.character),
                JSON.stringify(element.character),
                JSON.stringify(element.meaningRaw),
                JSON.stringify(element.kanaRaw)
            ].join(",");
        });

        data = data.join("\n");
        a.href = window.URL.createObjectURL(new Blob([data], {type: 'text/csv'}));
        a.download = vm.chosenType() + ".csv";
        
        // Append anchor to body.
        document.body.appendChild(a)
        a.click();

        // Remove anchor from body
        document.body.removeChild(a)
    };

    vm.dataLoaded = ko.computed(function() {
        return !!vm.data() && !vm.isLoading();
    });

    (function checkHash(hash) {
        if(!!hash && hash.length > 1) {
            vm.apiKey(hash.substring(1));
            vm.loadData();
        } else {
            vm.apiKey("");
        }
    })(window.location.hash);
    

    return vm;
})();

ko.applyBindings(viewModel);