# [Structered Content Sifter](https://openstax.github.io/sifter/)

This searches our books using any CSS selector! You can share the link with others so they can see the results too.

- :eyes: you can click the results to see the actual content!
- :zero: **Zero infrastructure** to maintain!
- :mouse2: just 150 lines of JS code!
- :link: share your search with others!
- :zap: subsequent searches are Lightning fast! (reload the page)
- :electric_plug: you can search offline!

## Examples

- [Does our content have a Note inside a Note?](https://openstax.github.io/sifter/#%7B%22q%22%3A%22%5Bdata-type%3D%5C%22note%5C%22%5D%20%5Bdata-type%3D%5C%22note%5C%22%5D%22%7D)
- [Do we even use the `<c:foreign>` tag?](https://openstax.github.io/sifter/#%7B%22q%22%3A%22%5Bdata-type%3D%5C%22foreign%5C%22%5D%22%7D)
- [Where are our footnotes?](https://openstax.github.io/sifter/#%7B%22q%22%3A%22%5Brole%3D%5C%22doc-footnote%5C%22%5D%22%7D)
- [What do we use subscripts for?](https://openstax.github.io/sifter/#%7B%22q%22%3A%22sub%22%7D)

## What is this sorcery?

It is a [PWA](https://web.dev/progressive-web-apps/) which uses service-workers to **run offline** & cache the books locally (see the [Lighthouse](https://developers.google.com/web/tools/lighthouse/) tab in Chrome).

It runs in your browser and pulls content from archive-staging.

> So, are you saying the next time I'm ice-climbing in the Himalayas or free-soloing El Capitan I can find out which books have subfigures in them?

### Absolutely!
