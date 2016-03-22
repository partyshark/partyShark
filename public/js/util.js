Util = {
    log: console.log.bind(console),

    reviveDataset: function(dataset) {
        var ret = [ ];
        dataset.values.forEach(function(valList) {
            var obj = { };
            valList.forEach(function(item, index) {
                obj[dataset.properties[index]] = item;
            });
            ret.push(obj);
        });
        return ret;
    },

    applyUpdate: function(orig, update) {
        for (var prop in orig) {
            if (orig.hasOwnProperty(prop) && update.hasOwnProperty(prop)) {
                orig[prop] = update[prop];
            }
        }
    },

    extractProperties: function(source, propNames) {
        var ret = { };
        for (var i = 0; i < propNames.length; i++) {
            if (source.hasOwnProperty(propNames[i])) {
                ret[propNames[i]] = source[propNames[i]];
            }
        }
        return ret;
    },

    shallowCopy: function(source) {
        var ret = { };
        for(var prop in source) {
            if(source.hasOwnProperty(prop)) { ret[prop] = source[prop]; }
        }
        return ret;
    },

    Publisher: function () {
        var subs = [ ];

        this.subscribe = function(callback) {
            subs.push(callback);

            return {
                cancel: function() {
                    subs.splice(subs.indexOf(callback), 1);
                }
            };
        };

        this.publish = function(arg) {
            for(var i = 0; i < subs.length; i++) { subs[i](arg); }
        };
    }
}