# How to Install

You can either get **RxDeep** via a NPM (or yarn or whatever other package manager you have)
or get it directly via a CDN.

---

## NPM

```bash
npm i rxdeep
```

Now you can `import` or `require()` **RxDeep** functions in your JS/TS code:

```ts
import { state } from 'rxdeep';
```
```js
const { state } = require('rxdeep');
```

---

## CDN

The client-side bundles of **RxDeep** are provided alongside the published NPM package.
You can fetch them via services such as [UNPKG](https://unpkg.com/browse/rxdeep@0.2.0/dist/bundles/)
or [jsDelivr](https://cdn.jsdelivr.net/npm/rxdeep@0.2.0/dist/bundles/). Note that
you would also need [RxJS](https://rxjs.dev) bundle:

```html
<script src="https://cdn.jsdelivr.net/npm/rxjs@6.6.0/bundles/rxjs.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/rxdeep@0.2.0/dist/bundles/rxdeep.es6.min.js"></script>
```

Fetching the bundle via CDN defines the global variable `rxdeep`, containing all methods
and classes:

```html
<script>
const { state } = rxdeep;

const s = state(42);
// ...
</script>
```

> :ToCPrevNext

