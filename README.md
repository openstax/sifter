# [Structered Content Sifter](https://openstax.github.io/sifter/)

This searches our books using any CSS selector! You can share the link with others so they can see the results too.

- :eyes: you can click the results to see the actual content!
- :zero: **Zero infrastructure** to maintain!
- :mouse2: just 150 lines of JS code!
- :link: share your search with others!
- :zap: subsequent searches are Lightning fast! (reload the page)
- :electric_plug: you can search offline!

## Examples

- [Where do we use subscripts?](https://openstax.github.io/sifter/#%7B%22q%22%3A%22sub%22%7D)
- [Which content is marked `.unnumbered`](https://openstax.github.io/sifter/#%7B%22q%22%3A%22.unnumbered%22%7D)
- [Do we even use the `<c:foreign>` tag?](https://openstax.github.io/sifter/#%7B%22q%22%3A%22%5Bdata-type%3D%5C%22foreign%5C%22%5D%22%7D)
- [Where are our footnotes?](https://openstax.github.io/sifter/#%7B%22q%22%3A%22%5Brole%3D%5C%22doc-footnote%5C%22%5D%22%7D)
- [Does our content have a Note inside a Note?](https://openstax.github.io/sifter/#%7B%22q%22%3A%22%5Bdata-type%3D%5C%22note%5C%22%5D%20%5Bdata-type%3D%5C%22note%5C%22%5D%22%7D)
- Links
    - [What are all the external links?](https://openstax.github.io/sifter/#%7B%22q%22%3A%22a%5Bhref%5E%3Dhttp%5D%22%7D)
    - [Which links go to an unsecure site?](https://openstax.github.io/sifter/#%7B%22q%22%3A%22a%5Bhref%5E%3D%5C%22http%3A%5C%22%5D%22%7D)
- Exercises with Solutions...
    - ... [in the content](https://openstax.github.io/sifter/#%7B%22q%22%3A%22%5Bdata-type%3D%5C%22exercise%5C%22%5D%20%5Bdata-type%3D%5C%22solution%5C%22%5D%22%7D) (e.g. an Example Exercise)
    - ... [at the back of the book](https://openstax.github.io/sifter/#%7B%22q%22%3A%22%5Bdata-type%3D%5C%22exercise%5C%22%5D%20%5Bdata-type%3D%5C%22problem%5C%22%5D%20%3E%20a.os-number%22%7D)
- **XPath:** [Exercises with Solutions at the back of the book](https://openstax.github.io/sifter/#%7B%22q%22%3A%22%2F%2Fh%3A*%5B%40data-type%3D%5C%22exercise%5C%22%5D%5Bh%3A*%5B%40data-type%3D%5C%22problem%5C%22%5D%5Bh%3Aa%5B%40class%3D'os-number'%5D%5D%5D%22%7D)

# Screencap

[![screencap](https://user-images.githubusercontent.com/253202/85438274-6c2ba700-b551-11ea-8157-897d12a527ae.gif)](https://openstax.github.io/sifter/)


## What is this sorcery?

It is a [PWA](https://web.dev/progressive-web-apps/) which uses service-workers to **run offline** & cache the books locally (see the [Lighthouse](https://developers.google.com/web/tools/lighthouse/) tab in Chrome).

It runs in your browser and pulls content from archive-staging.

> So, are you saying the next time I'm ice-climbing in the Himalayas or free-soloing El Capitan I can find out which books have subfigures in them?

### Absolutely!
