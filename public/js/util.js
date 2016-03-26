Util = Object.freeze({
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
    },

    convertProperties: function(orig, conversions) {
        for (var prop in orig) {
            if (orig.hasOwnProperty(prop) && conversions.hasOwnProperty(prop)) {
                orig[prop] = conversions[prop](orig[prop]);
            }
        }
        return orig;
    }
});

Convert = Object.freeze({
    toNumberLax: function(v) {
        var k = 1 * v;
        return ((v || v === 0) && (k || k === 0)) ? k : null;
    },
    toNumberStrict: function(v) {
        var k = Convert.toNumberLax(v);
        if (k === null) { throw TypeError('Conversion failed on object: '+v); }
        return k;
    },
    toBoolLax: function(v) {
        if (v === undefined || v === null || isNaN(v)) { return null; }
        else { return !!v; }
    },
    toBoolStrict: function(v) {
        return !!v;
    },
    toStringLax: function(v) {
        return (v === null || v === undefined || isNan(v)) ? null : JSON.stringify(v);
    },
    toStringStrict: function(v) {
        var k = Convert.toStringLax(v);
        if (k === null) { throw TypeError('Conversion failed on object: '+v); }
        return k;
    },
    toIntLax: function(v) {
        var k = Convert.toNumberLax(v);
        return (k === null) ? null : Math.round(k);
    },
    toIntStrict: function(v) {
        return Math.round(this.toNumberStrict(v));
    }
});