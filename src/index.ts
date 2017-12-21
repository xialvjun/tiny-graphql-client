export function create_client<T>(send: (body: { operationName: string, query: string, variables: any }, extra?: any) => T) {
    const fragments = {};
    function detect_fragments(query: string, old_detected_fragments: string[]=[]) {
        const detected_fragments = (query.match(/\.{3}(\w+)/g) || [])
            .map(f => f.slice(3))
            .reduce((acc, cv) => acc.indexOf(cv) === -1 ? acc.concat(cv) : acc, []);
        const new_detected_fragments = detected_fragments
            .filter(f => old_detected_fragments.indexOf(f) === -1)
            .filter(f => fragments[f]);
        if (new_detected_fragments.length > 0) {
            return detect_fragments(query + '\n' + new_detected_fragments.map(f => fragments[f] || '').join('\n'), detected_fragments);
        }
        return query;
    }
    function run(query: string, variables?, extra?) {
        const operationName = query.match(/(query|mutation)\s+(\w+)/)[2];
        if (!operationName) {
            throw new Error('not valid query: ' + query);
        }
        query = detect_fragments(query);
        return send({ operationName, query, variables }, extra);
    }
    function register_fragment(fragment: string) {
        const fragment_name = fragment.match(/fragment\s+(\w+)/)[1];
        if (!fragment_name) {
            throw new Error('not valid fragment: ' + fragment);
        }
        if (fragments[fragment_name]) {
            console.warn('overrided fragment ' + fragment_name);
        }
        fragments[fragment_name] = fragment;
    }
    return { run, register_fragment, fragments };
}
