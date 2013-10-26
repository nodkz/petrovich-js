"use strict";

(function(){

    // Predefined values
    var predef = {
        genders: ['male', 'female', 'androgynous'],
        nametypes: ['first', 'last', 'middle'],
        cases: ['nominative', 'genitive', 'dative', 'accusative', 'instrumental', 'prepositional']
    };

    // Auxiliary function, used by validate() and find_rule_local()
    function contains(x, arr) {
        for (var i in arr) { if (arr[i] === x) return true; }
        return false;
    }

    // Validates that gender and case are members of predef
    // No Array.indexOf owing to IE8
    function validate(gender, gcase) {
        if (!contains(predef.genders, gender))
            throw new Error('Invalid gender: ' + gender);
        if (!contains(predef.cases, gcase))
            throw new Error('Invalid case: ' + gcase);
    }

    // First use method:
    // var person = { gender: 'female', first: 'Маша' };
    // petrovich(person, 'dative');
    var petrovich = function(person, gcase) {
        validate(person.gender, gcase);
    };

    // Second use method:
    // Build dynamically methods chain like petrovich.male.first.dative(name)
    // Isolate scope to reduce polluting scope with temp variables
    (function() {
        for (var i in predef.genders) {
            var gender = predef.genders[i];
            if (!petrovich[gender]) petrovich[gender] = {};
            for (var k in predef.nametypes) {
                var nametype = predef.nametypes[k];
                if (!petrovich[gender][nametype])
                    petrovich[gender][nametype] = {};
                for (var l in predef.cases) {
                    var gcase = predef.cases[l];
                    // The flower on the mountain peak:
                    petrovich[gender][nametype][gcase] =
                        (function(gender, nametype, gcase){
                            return function(name) {
                                inflect(gender, name, gcase, nametype+'name');
                            };
                        })(gender, nametype, gcase);
                }
            }
        }
    })();

    // Export for NodeJS or browser
    if (module && module.exports) module.exports = kuzmich;
    else if (window) window.kuzmich = kuzmich;




    // Key private method, used by all public methods
    function inflect (gender, name, gcase, nametype) {
        var nametype_rulesets = rules[nametype],
            parts = name.split('-'),
            result = [];
            for (var k in parts) {
                var part = parts[k],
                    first_word = k === 0 && parts.size > 1,
                    rule = find_rule_global(gender, name,
                        nametype_rulesets, {first_word: first_word});
                if (rule) result.push(apply_rule(name, gcase, rule));
                else result.push(name);
            }
            return result.join('-');
    }


    // Find groups of rules in exceptions or suffixes of given nametype
    function find_rule_global(gender, name, nametype_rulesets, features) {
        if (!features) features = {};
        var tags = [];
        for (var key in features) {
            if (features[key]) tags.push(key);
        }
        if (nametype_rulesets.exceptions) {
            var rule = find_rule_local(
                gender, name, nametype_rulesets.exceptions, true, tags);
            if (rule) return rule;
        }
        return find_rule_local(
            gender, name, nametype_rulesets.suffixes, false, tags);
    };


    // Local search in rulesets of exceptions or suffixes
    function find_rule_local(gender, name, ruleset, match_whole_word, tags) {
        for (var i in ruleset) {
            var rule = ruleset[i];

            if (rule.tags) {
                var common_tags = [];
                for (var k in rule.tags) {
                    var tag = rule.tags[k];
                    if (!contains(tags, tag)) common_tags.push(tag);
                }
                if (!common_tags.length) continue;
            }
            if (rule.gender !== 'androgynous' && gender !== rule.gender)
                continue;

            name = name.toLowerCase();
            for (var k in rule.test) {
                var sample = rule.test[k];
                var test = match_whole_word ? name :
                    name.substr(name.length - sample.length);
                if (test === sample) return true;
            }
        }
        return false;
    }


    // Apply found rule to given name
    // Move error throwing from this function to API method
    function apply_rule(name, gcase, rule) {
        var mod;
        if (gcase === 'nominative') mod = '.';
        else if (contains(predef.cases, gcase)) {
            for (var i in predef.cases) {
                if (gcase === predef.cases[i]) {
                    mod = rule.mods[i-1];
                    break;
                }
            }
        } else throw new Error('Unknown grammatic case: ' + gcase);
        
        for (var i in mod) {
            var chr = ;
            switch (chr) {
                case '.': break;
                case '-':
                    name = name.substr(0, name.length-1);
                    break;
                default: name += chr;
            }
        }
        return name;
    }


    var rules = null; // grunt: replace rules

})();