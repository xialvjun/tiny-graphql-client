"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FRAGMENT_USE_REGEX = /\.{3}(\w+)/g;
var FRAGMENT_DEF_REGEX = /^fragment\s+(\w+)/;
var OPERATION_NAME_REGEX = /^(query|mutation)(\s+\w+)?\s*([\(\{])/;
var random_name = function () { return Math.random().toString(32).slice(2); };
function create_client(send) {
    var fragments = {};
    function detect_fragments(query, old_detected_fragments) {
        if (old_detected_fragments === void 0) { old_detected_fragments = []; }
        var detected_fragments = (query.match(FRAGMENT_USE_REGEX) || [])
            .map(function (f) { return f.slice(3); })
            .reduce(function (acc, cv) { return acc.indexOf(cv) === -1 ? acc.concat(cv) : acc; }, []);
        var new_detected_fragments = detected_fragments
            .filter(function (f) { return old_detected_fragments.indexOf(f) === -1; })
            .filter(function (f) { return fragments[f]; });
        if (new_detected_fragments.length > 0) {
            return detect_fragments(query + '\n' + new_detected_fragments.map(function (f) { return fragments[f] || ''; }).join('\n'), detected_fragments);
        }
        return query;
    }
    function run(query, variables, extra) {
        query = query.trim();
        query = query.startsWith('{') ? "query " + query : query;
        var match = query.match(OPERATION_NAME_REGEX);
        if (!match) {
            throw new Error('not valid query: ' + query);
        }
        var operationName = (match[2] || '').trim();
        if (!operationName) {
            operationName = 'op' + random_name();
        }
        query = query.replace(match[0], match[1] + " " + operationName + (match[3] === '(' ? '(' : ' {'));
        query = detect_fragments(query);
        return send({ operationName: operationName, query: query, variables: variables }, extra);
    }
    function register_fragment(fragment) {
        fragment = fragment.trim();
        var fragment_name = fragment.match(FRAGMENT_DEF_REGEX)[1];
        if (!fragment_name) {
            throw new Error('not valid fragment: ' + fragment);
        }
        if (fragments[fragment_name]) {
            console.warn('overrided fragment ' + fragment_name);
        }
        fragments[fragment_name] = fragment;
    }
    return { run: run, register_fragment: register_fragment, fragments: fragments };
}
exports.create_client = create_client;
