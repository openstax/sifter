# [Structered Content Sifter](https://openstax.github.io/sifter/)

This searches our books using any CSS selector! You can share the link with others so they can see the results too.

- :eyes: you can click the results to see the actual content!
- :zero: **Zero infrastructure** to maintain!
- :mouse2: just 150 lines of JS code!
- :link: share your search with others!
- :zap: subsequent searches are Lightning fast! (reload the page)
- :electric_plug: you can search offline!

## Examples

Knowledge of CSS selectors or XPath selectors is required for searching. See [Help](./help.md) for a quick reference and links to more comprehensive documentation.

- [Where do we use subscripts?](https://openstax.github.io/sifter/?v=1&sourceFormat=xhtml&q=sub)
- [Which content is marked `.unnumbered`](https://openstax.github.io/sifter/?v=1&sourceFormat=xhtml&q=.unnumbered)
- [Do we even use the `<c:foreign>` tag?](https://openstax.github.io/sifter/?v=1&sourceFormat=cnxml&q=//c:foreign)
- [Where are our footnotes?](https://openstax.github.io/sifter/?v=1&sourceFormat=xhtml&q=[role="doc-footnote"])
- [Does our content have a Note inside a Note?](https://openstax.github.io/sifter/?v=1&sourceFormat=cnxml&q=//c:note//c:note)
- Links
    - [What are all the external links?](https://openstax.github.io/sifter/?v=1&sourceFormat=xhtml&q=a[href%5E=http])
    - [Which links go to an unsecure site?](https://openstax.github.io/sifter/?v=1&sourceFormat=xhtml&q=a[href%5E="http%3A"])
- Exercises with Solutions...
    - ... [in the content](https://openstax.github.io/sifter/?v=1&sourceFormat=cnxml&q=//c:exercise//c:solution) (e.g. an Example Exercise)
    - ... [at the back of the book](https://openstax.github.io/sifter/?v=1&sourceFormat=xhtml&q=[data-type="exercise"]+[data-type="problem"]+>+a.os-number)
- **XPath:** 
    - [Exercises with Solutions at the back of the book](https://openstax.github.io/sifter/?v=1&sourceFormat=xhtml&q=%2F%2Fh%3A*[%40data-type="exercise"][h%3A*[%40data-type="problem"][h%3Aa[%40class=%27os-number%27]]])
    - [Invalid number of children in msubsup](https://openstax.github.io/sifter/?v=1&sourceFormat=xhtml&q=//m%3Amsubsup[count(*)!=3])
    - [The URL of all links containing the term openstaxcollege](https://openstax.github.io/sifter/?v=1&q=%2F%2Fh%3Aa[contains(%40href%2C+'openstaxcollege')]%2F%40href&code=&sourceFormat=xhtml)

# Screencap

[![screencap](https://user-images.githubusercontent.com/253202/85438274-6c2ba700-b551-11ea-8157-897d12a527ae.gif)](https://openstax.github.io/sifter/)


## What is this sorcery?

It is a [PWA](https://web.dev/progressive-web-apps/) which uses service-workers to **run offline** & cache the books locally (see the [Lighthouse](https://developers.google.com/web/tools/lighthouse/) tab in Chrome).

It runs in your browser and pulls content from archive-staging.

> So, are you saying the next time I'm ice-climbing in the Himalayas or free-soloing El Capitan I can find out which books have subfigures in them?

### Absolutely!


## Development

1. clone this repository and switch to this directory
1. start a little static webserver by running `python -m SimpleHTTPServer 8080`
1. visit http://localhost:8080/


## ToDone

- [x] Search CNXML
- [ ] Select subset of books to search
- [ ] Change which server to get content from (currently archive-staging)
