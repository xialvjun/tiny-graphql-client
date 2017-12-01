/**
 * @example extra_headers
 * ```js
 * const client = create_client((body, extra_headers) => {
 *     return fetch('http://graphql.org/graphql', {
 *         method: 'post',
 *         body: JSON.stringify(body),
 *         headers: {
 *             contentType: 'application/json',
 *             authorization: 'Bearer asdhjkasfhiuoewwqt',
 *             ...extra_headers,
 *         },
 *     });
 * });
 * 
 * client(`query me { me { name, age } }`, undefined, { header1: '123', header2: '456' }).then(res => res.json()).then(r => console.log(r.data.me));
 * ```
 * @example extra as callback
 * ```js
 * const client = create_client((body, callback) => {
 *     return fetch('http://graphql.org/graphql', {
 *         method: 'post',
 *         body: JSON.stringify(body),
 *         headers: {
 *             contentType: 'application/json',
 *             authorization: 'Bearer asdhjkasfhiuoewwqt',
 *         },
 *     }).then(res => res.json()).then(res => callback(null, res)).catch(error => callback(error));
 * });
 * 
 * client(`query me{me{name,age}}`, undefined, r => console.log(r.data.me));
 * ```
 * @example whatever extras
 * ```js
 * const client = create_client((body, extra) => {
 *     return fetch(extra.url, {
 *         body: JSON.stringify(body),
 *         ...extra.options,
 *     }).then(r => r.json());
 * });
 * 
 * client(`query me { me { name, age } }`, undefined, { url: 'http://graphql.org/graphql', options: { method: 'post' } }).then(r => console.log(r.data.me));
 * ```
 * @example register_fragment
 * ```js
 * const client = create_client(your_custom_send_function);
 * client.register_fragment(`fragment person_fragment on Person { name, age }`);
 * client(`query me { me { ...person_fragment } }`).then(r => r.json()).then(r => console.log(r.data.me));
 * ```
 * @example batch_request
 * ```js
 * function batch_send() {
 *     const cache = [];
 *     let timeout_id = null;
 *     return (body, extra) => {
 *         return new Promise((resolve, reject) => {
 *             cache.push({ resolve, reject, body, extra });
 *             start();
 *         });
 *     };
 *     function start() {
 *         if (timeout_id !== null) return;
 *         timeout_id = setTimeout(() => {
 *             timeout_id = null;
 *             fetch('http://graphql.org/graphql', {
 *                 method: 'post',
 *                 body: JSON.stringify(cache.map(c => c.body)),
 *                 headers: {
 *                     contentType: 'application/json',
 *                     authorization: 'Bearer asfasdhbfoewq',
 *                 },
 *             }).then(res => res.json()).then(res => {
 *                 // todo: resolve those promises
 *                 cache.splice(0, -1);
 *             }).catch(error => {
 *                 cache.forEach(c => c.reject(error));
 *                 cache.splice(0, -1);
 *             });
 *         }, 0);
 *     }
 * }
 * 
 * const client = create_client(batch_send());
 * ```
 * @param {(body, extra) => Promise | void} send: your custom request function
 * @returns {(query, variables, extra) => Promise | void} and the returned function has a property `register_fragment: (fragment: string) => void`
 */
export function create_client(send) {
    const fragments = {};
    function client(query, variables, extra) {
        const operationName = query.match(/query\s+(\w+)|mutation\s+(\w+)/)[1];
        if (!operationName) {
            throw new Error('not valid query: ' + query);
        }
        (query.match(/\.{3}(\w+)/g) || [])
            .map(f => f.slice(3))
            .reduce((acc, cv) => acc.indexOf(cv)===-1 && acc.concat(cv), [])
            .forEach(f => {
                query += '\n' + (fragments[f] || '');
            });
        return send({ operationName, query, variables }, extra);
    }
    function register_fragment(fragment) {
        const fragment_name = fragment.match(/fragment\s+(\w+)/)[1];
        if (!fragment_name) {
            throw new Error('not valid fragment: ' + fragment);
        }
        if (fragments[fragment_name]) {
            console.warn('overrider fragment ' + fragment_name);
        }
        fragments[fragment_name] = fragment;
    }
    client.register_fragment = register_fragment;
    return client;
}
