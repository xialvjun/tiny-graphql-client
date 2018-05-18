# tiny-graphql-client
A tiny, simple and customable graphql client, only support `query` and `mutation` now.

## Install
`npm i @xialvjun/tiny-graphql-client` or `yarn add @xialvjun/tiny-graphql-client`

## examples

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

client.run(`query me { me { name, age } }`, undefined, { header1: '123', header2: '456' }).then(res => res.json()).then(r => console.log(r.data.me));
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

client.run(`query me{me{name,age}}`, undefined, r => console.log(r.data.me));
```

**whatever extras**

```js
const client = create_client((body, extra) => {
    return fetch(extra.url, {
        body: JSON.stringify(body),
        ...extra.options,
    }).then(r => r.json());
});

client.run(`query me { me { name, age } }`, undefined, { url: 'http://graphql.org/graphql', options: { method: 'post' } }).then(r => console.log(r.data.me));
```

**register_fragment**

```js
const client = create_client(your_custom_send_function);
client.register_fragment(`
fragment person_fragment on Person {
  id, name, age
}`);
client.register_fragment(`
fragment book_fragment on Book {
  id, title, cover
  author { ...person_fragment }
}`);
// and even nested fragments
client.run(`
query book($id: $ID!) {
  book(id: $id) { ...book_fragment }
}`, { id: '123456789' })
  .then(r => r.json())
  .then(r => console.log(r.data.book));
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
            const to_fetch = cache.slice();
            cache.splice(0, -1);
            fetch('http://graphql.org/graphql', {
                method: 'post',
                body: JSON.stringify(cache.map(c => c.body)),
                headers: {
                    contentType: 'application/json',
                    authorization: 'Bearer asfasdhbfoewq',
                },
            }).then(res => res.json()).then(res => {
                // todo: resolve those promises
                // to_fetch do something according to the structure of res
            }).catch(error => {
                to_fetch.forEach(c => c.reject(error));
            });
        }, 0);
    }
}

const client = create_client(batch_send());
```
