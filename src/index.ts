const FRAGMENT_USE_REGEX = /\.{3}(\w+)/g;
const FRAGMENT_DEF_REGEX = /^fragment\s+(\w+)/;
const OPERATION_NAME_REGEX = /^(query|mutation)(\s+\w+)?\s*([\(\{])/;

const random_name = () => Math.random().toString(32).slice(2);

export function create_client<T>(send: (body: { operationName: string, query: string, variables: any }, extra?: any) => T) {
    const fragments = {};
    function detect_fragments(query: string, old_detected_fragments: string[]=[]) {
        const detected_fragments = (query.match(FRAGMENT_USE_REGEX) || [])
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
        query = query.trim();
        query = query.startsWith('{') ? `query ${query}` : query;
        const match = query.match(OPERATION_NAME_REGEX);
        if (!match) {
            throw new Error('not valid query: ' + query);
        }
        let operationName = (match[2] || '').trim();
        if (!operationName) {
            operationName = random_name();
        }
        query = query.replace(match[0], `${match[1]} ${operationName}${match[3]==='(' ? '(' : ' {'}`);
        query = detect_fragments(query);
        return send({ operationName, query, variables }, extra);
    }
    function register_fragment(fragment: string) {
        fragment = fragment.trim();
        const fragment_name = fragment.match(FRAGMENT_DEF_REGEX)[1];
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
