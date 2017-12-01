### a very tiny and customable graphql client

#### use examples

**extra_headers**

```js
const client = create_client((body, extra_headers) => {
    return fetch('http://graphql.org/graphql', {
        method: 'post',
        body: JSON.stringify(body),
        headers: {
            contentType: 'application/json',
            authorization: 'Bearer asdhjkasfhiuoewwqt',
            ...extra_headers,
        },
    });
});

client(`query me { me { name, age } }`, undefined, { header1: '123', header2: '456' }).then(res => res.json()).then(r => console.log(r.data.me));
```

**extra as callback**

```js
const client = create_client((body, callback) => {
    return fetch('http://graphql.org/graphql', {
        method: 'post',
        body: JSON.stringify(body),
        headers: {
            contentType: 'application/json',
            authorization: 'Bearer asdhjkasfhiuoewwqt',
        },
    }).then(res => res.json()).then(res => callback(null, res)).catch(error => callback(error));
});

client(`query me{me{name,age}}`, undefined, r => console.log(r.data.me));
```

**whatever extras**

```js
const client = create_client((body, extra) => {
    return fetch(extra.url, {
        body: JSON.stringify(body),
        ...extra.options,
    }).then(r => r.json());
});

client(`query me { me { name, age } }`, undefined, { url: 'http://graphql.org/graphql', options: { method: 'post' } }).then(r => console.log(r.data.me));
```

**register_fragment**

```js
const client = create_client(your_custom_send_function);
client.register_fragment(`fragment person_fragment on Person { name, age }`);
client(`query me { me { ...person_fragment } }`).then(r => r.json()).then(r => console.log(r.data.me));
```

**batch_request**

```js
function batch_send() {
    const cache = [];
    let timeout_id = null;
    return (body, extra) => {
        return new Promise((resolve, reject) => {
            cache.push({ resolve, reject, body, extra });
            start();
        });
    };
    function start() {
        if (timeout_id !== null) return;
        timeout_id = setTimeout(() => {
            timeout_id = null;
            fetch('http://graphql.org/graphql', {
                method: 'post',
                body: JSON.stringify(cache.map(c => c.body)),
                headers: {
                    contentType: 'application/json',
                    authorization: 'Bearer asfasdhbfoewq',
                },
            }).then(res => res.json()).then(res => {
                // todo: resolve those promises
                cache.splice(0, -1);
            }).catch(error => {
                cache.forEach(c => c.reject(error));
                cache.splice(0, -1);
            });
        }, 0);
    }
}

const client = create_client(batch_send());
```
