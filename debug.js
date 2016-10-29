function monitorObservables(obj, property) {
    var attach = function(observable) {
        obj[observable].subscribe(function(value) {
            console.log(observable, "<-", value);
        });
    }

    if(!property) {
        for(property in obj) {
            if(ko.isObservable(obj[property])) {
                attach(property);
            }
        }
        
    }
    else if(typeof(property) === "string") {
        attach(property);
    } else if (property.constructor === Array) {
        property.forEach(attach);
    }
};

//monitorObservables(viewModel);