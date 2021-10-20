window.addEventListener('load', () => {
    const ablUrl = '/content-manager-approved-books/approved-book-list.json'
    const serverRootUrl = 'https://archive-staging.cnx.org/contents'
    const legacyRoot = 'https://legacy.cnx.org/content'
    const namespacePrefixes = {
        'c'     : 'http://cnx.rice.edu/cnxml',
        'cnx'   : 'http://cnx.rice.edu/cnxml',
        'h'     : 'http://www.w3.org/1999/xhtml',
        'xhtml' : 'http://www.w3.org/1999/xhtml',
        'm'     : 'http://www.w3.org/1998/Math/MathML',
        'mml'   : 'http://www.w3.org/1998/Math/MathML',
        'mathml': 'http://www.w3.org/1998/Math/MathML'
    }

    const qs = (sel) => {
        const el = document.querySelector(sel)
        if (!el) { throw new Error(`BUG: Could not find "${sel}"`) }
        return el
    }

    const selectorEl = qs('#selector')
    const startEl = qs('#start')
    const stopEl = qs('#stop')
    const skipEl = qs('#skip')
    const resultsEl = qs('#results')
    const sandboxEl = qs('#sandbox')
    const stopAfterOneEl = qs('#stop-after-one')
    const bookCountEl = qs('#book-count')
    const analyzeCodeEl = qs('#analyze-code')
    const stopAfterNPages = qs('#stop-after-n-pages')
    const booksEl = qs('#books')
    const validationMessageEl = qs('#validation-message')
    const form = qs('form')
    const sourceFormat = form.elements['sourceFormat']    

    let isStopping = false
    let isSkipping = false
    bookCountEl.setAttribute('href', ablUrl)

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    function* times(x) {
        for (var i = 0; i < x; i++)
            yield i;
    }
    async function fetchWithBackoff(url, useJson) {
        for (var _ of times(3)) {
            try {
                if (useJson) {
                    return fetchJson(url)
                } else {
                    return fetchText(url)
                }
            } catch (err) {
            }
            await sleep(300)
        }
        try {
            if (useJson) {
                return fetchJson(url)
            } else {
                return fetchText(url)
            }
        } catch (err) {
            console.error(err)
            console.log(`Bad url ${url}`)
        }
    }
    const fetchJson = async (url) => (await fetch(url)).json() 
    const fetchText = async (url) => (await fetch(url)).text() 

    let isValid = false
    function getSelectedBookUUIDs() {
        return Array.from(booksEl.querySelectorAll("option:checked"), e => e.value)
    }
    const getValidationMessage = () => {
        if (sourceFormat.value !== 'xhtml' && sourceFormat.value !== 'cnxml') {
            return 'Choose a format to search: XHTML or CNXML'
        }
        if (getSelectedBookUUIDs().length === 0) {
            return 'Select at least one book'
        }
        const selector = selectorEl.value
        if (selector[0] === '/') {
            // validate it as an XPath (ensure it begins with "/h:")
            if (/^\/[h,c,m]:/.test(selector) || /^\/\/[h,c,m]:/.test(selector)) {
                try {
                    document.evaluate(selector, sandboxEl, xpathNamespaceResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
                    return '' // valid!
                } catch (e) {
                    return 'Malformed XPath selector'
                }
            }
        }
        // Try validating this as a CSS selector
        try {
            document.querySelector(selector)
            return '' // valid!
        } catch (e) {
            return 'Malformed CSS selector'
        }
    }
    const validateSelector = () => {
        const msg = getValidationMessage()
        selectorEl.setCustomValidity(msg)
        isValid = !msg
        validationMessageEl.textContent = msg
    }
    selectorEl.addEventListener('input', validateSelector)
    selectorEl.addEventListener('keyup', validateSelector)
    form.addEventListener('change', validateSelector)

    startEl.addEventListener('click', (e) => {
        e.preventDefault()

        const params = new URLSearchParams(new FormData(form))
        params.delete('books')
        window.location.hash = params.toString()
        doStart()
    })
    skipEl.addEventListener('click', (e) => { e.preventDefault(); isSkipping = true } )
    stopEl.addEventListener('click', (e) => { e.preventDefault(); isStopping = true } )
    const startFn = async () => {
        // For each book, fetch the ToC
        // Fetch each Page
        // Replace ` src=` with ` data-src=` so we do not fetch images
        // Inject it into a hidden element
        // Run the query
        // Remember if there was a match (maybe find the nearest id attribute)

        const selector = selectorEl.value
        const analyzeFn = new Function('type', 'json', 'bookUuid', 'pageUuid', analyzeCodeEl.value)

        const bookUuids = getSelectedBookUUIDs()

        // clear
        isStopping = false
        resultsEl.innerHTML = ''

        selectorEl.disabled = true
        startEl.disabled = true
        booksEl.disabled = true
        stopEl.disabled = false
        skipEl.disabled = false

        // these are done in parallel
        for (const bookUuid of bookUuids) {
            let totalMatches = 0
            isSkipping = false

            const t1 = document.createElement('li')
            const detailsEl = document.createElement('details')
            const summaryEl = document.createElement('summary')
            const bookResultsEl = document.createElement('ul')
            const bookLogEl = document.createElement('span')
            const bookTitleEl = document.createElement('span')
            bookLogEl.classList.add('book-status')
            t1.append(detailsEl)
            detailsEl.append(summaryEl)
            summaryEl.append(bookTitleEl)
            summaryEl.append(bookLogEl)

            detailsEl.append(bookResultsEl)
            resultsEl.prepend(t1)

            const bookUrl = `${serverRootUrl}/${bookUuid}`
            const bookJson = await fetchWithBackoff(bookUrl, true)

            analyzeFn('BOOK:START', bookJson, bookUuid)

            bookTitleEl.textContent = bookJson.title

            const pageRefs = []
            recLeafPages(pageRefs, bookJson.tree)
    
            for (const pageRef of pageRefs) {
                const i = pageRefs.indexOf(pageRef)

                // Check this in the loop so that users can update the value while this is running
                let stopAfterNPagesCount = Number.parseInt(stopAfterNPages.value)
                if (Number.isNaN(stopAfterNPagesCount)) {
                    stopAfterNPagesCount = Number.POSITIVE_INFINITY
                }
                if (i >= stopAfterNPagesCount) {
                    break
                }
    
                const pageUrl = `${bookUrl}:${pageRef.id}`
                const pageJson = await fetchWithBackoff(pageUrl, true)
      
                analyzeFn('PAGE', pageJson, bookUuid, pageRef.id)
                
                let sourceCode
                if (sourceFormat.value === 'cnxml') {
                    const moduleResource = pageJson.resources.filter(r => r.filename === 'index.cnxml')[0]
                    if (!moduleResource) { 
                        continue
                    }
                    sourceCode = await fetchWithBackoff(`https://archive-staging.cnx.org/resources/${moduleResource.id}`, false)
                    sourceCode = sourceCode.replace('<?xml version="1.0"?>', '')
                } else {
                    sourceCode = pageJson.content
                }
                const matches = findMatches(selector, sourceCode)
                totalMatches += matches.length
                bookLogEl.textContent = `(${i + 1}/${pageRefs.length}. Found ${totalMatches})`
    
                // Add a list of links to the matched elements
                for (const match of matches) {
                    detailsEl.classList.add('found-matches')

                    const nearestId = findNearestId(match)
                    const nodeValue = getNodeValue(match)
    
                    const li = document.createElement('li')
                    const moduleInfo = pageJson.legacy_id ? `<a target="_blank" href="${legacyRoot}/${pageJson.legacy_id}/latest/#${nearestId}">${pageJson.legacy_id}</a> ` : ''
                    try {
                        li.innerHTML = `${moduleInfo}${pageJson.title} <a target="_blank" href="${pageUrl}.html#${nearestId}">${nodeValue}</a>`
                    } catch (e) {
                        console.error(e)
                        console.log('invalid XML')
                    }
                    bookResultsEl.append(li)
                }

                if (matches.length > 0 && stopAfterOneEl.checked) {
                    // go to the next book
                    isSkipping = true
                }

                // Break when stop button is pressed
                if (isStopping) {
                    selectorEl.disabled = false
                    startEl.disabled = false
                    booksEl.disabled = false
                    stopEl.disabled = true
                    skipEl.disabled = true
                    return
                }
                if (isSkipping) {
                    break
                }
                
            }
            analyzeFn('BOOK:END', bookJson, bookUuid)    
        }

        selectorEl.disabled = false
        startEl.disabled = false
        booksEl.disabled = false
        stopEl.disabled = true
        skipEl.disabled = true

    }

    // load the form from the URL
    const querystringOrHash = window.location.search || window.location.hash
    if (querystringOrHash.length > 1) {
        const args = querystring(querystringOrHash.substring(1))
        for (const el of form.elements) {
            const key = el.name
            if (args[key]) {
                form.elements[key].value = args[key]
            }
        }
        validateSelector()
    }

    // Run!
    function doStart() {
        if (isValid) {
            startFn().then(null, (err) => {
                console.error(err.message)
                alert(`Error: ${err.message}`)
                selectorEl.disabled = false
                startEl.disabled = false
                stopEl.disabled = true
                skipEl.disabled = true
            })
        }
    }

    fetch(ablUrl).then(async res => {
        const approvedBookList = await res.json()
        console.log('Here is the approved book list:', approvedBookList)
        const bookIdAndSlugs = []

        // collect all the books & remember if they are archive/git
        approvedBookList.approved_books.forEach(bookContainer => {
            bookContainer.books.forEach(book => bookIdAndSlugs.push({...bookContainer, ...book}))
        })
        // sort by Book slug
        bookIdAndSlugs.sort((a, b) => {
            if (a.slug.toLowerCase() < b.slug.toLowerCase())
                return -1
            if (a.slug.toLowerCase() > b.slug.toLowerCase())
                return 1
            return 0
        })
        bookIdAndSlugs.forEach(({uuid, slug, collection_id, server}) => {
            const o = document.createElement('option')
            o.setAttribute('value', uuid)
            // Git books are not supported yet
            if (collection_id) {
                o.setAttribute('selected', 'selected')
            } else {
                o.setAttribute('disabled', 'disabled')
            }
            o.append(slug)
            booksEl.append(o)
        })

        bookCountEl.textContent = bookIdAndSlugs.length
        validateSelector()

    }, err => alert(`Problem getting the approved book list. Maybe you are offline or the URL has moved. '${ablUrl}'`))

    function recLeafPages(acc, node) {
        if (node.contents) {
            node.contents.forEach((child) => recLeafPages(acc, child))
        } else {
            acc.push(node)
        }
    }

    // https://developer.mozilla.org/en-US/docs/Web/XPath/Introduction_to_using_XPath_in_JavaScript#Implementing_a_User_Defined_Namespace_Resolver
    function xpathNamespaceResolver(prefix) {
        if (namespacePrefixes[prefix]) {
            return namespacePrefixes[prefix]
        } else {
            alert('Invalid namespace prefix. Use "h:" or "xhtml:" or "m:" or "mathml:" .')
            throw new Error(`Invalid namespace prefix "${prefix}"`)
        }
    }

    function findMatches(selector, html) {
        html = html.replace(/ src=/g, ' data-src=')
        
        sandboxEl.innerHTML = html
        // Try running the selector as CSS or XPath depending on the 1st character ('/' for XPath)
        if (selector[0] === '/') {
            // Verify that the Xpath selector begins with "/h:" or "//h:" or "//m:"
            // See https://developer.mozilla.org/en-US/docs/Web/XPath/Introduction_to_using_XPath_in_JavaScript#Implementing_a_User_Defined_Namespace_Resolver
            if (/^\/[h,c,m]:/.test(selector) || /^\/\/[h,c,m]:/.test(selector)) {
                const xpathResult = document.evaluate(selector, sandboxEl, xpathNamespaceResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
                const ret = []
                for (let i = 0; i < xpathResult.snapshotLength; i++) {
                    ret.push(xpathResult.snapshotItem(i))
                }
                return ret
            } else {
                alert('Malformed XPath selector. All elements must be prefixed with either an `h:` or `m:` or `c:` ')
                throw new Error(`Malformed selector: "${selector}"`)
            }
        } else {
            try {
                return [...sandboxEl.querySelectorAll(selector)]
            } catch (err) {
                alert('Malformed CSS selector. Try again.')
                throw new Error(`Malformed selector: "${selector}"`)
            }    
        }
    }

    function findNearestId(el) {
        if (!el || el === sandboxEl) { return '' }
        return (el.getAttribute && el.getAttribute('id')) || findNearestId(el.parentElement)
    }

    function getNodeValue(node) {
        switch (node.nodeType) {
            case Node.ATTRIBUTE_NODE: 
                return node.value
            default: return findTypeOfEl(node)
        }
    }


    function findTypeOfEl(el) {
        if (el.getAttribute) {
            const type = el.getAttribute('data-type')
            const cls = el.getAttribute('class')
            const id = el.getAttribute('id')
            const tagName = el.tagName
            if (type) { return type }
            if (cls) { return `${tagName}.${cls}`}
            if (id) { return `${tagName}#${id}`}
            return tagName
        } else {
            return findTypeOfEl(el.parentElement)
        }
    }

    function hasOwnProperty(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }
    function querystring(qs, sep, eq, options) {
        sep = sep || '&';
        eq = eq || '=';
        var obj = {};
      
        if (typeof qs !== 'string' || qs.length === 0) {
          return obj;
        }
      
        var regexp = /\+/g;
        qs = qs.split(sep);
      
        var maxKeys = 1000;
        if (options && typeof options.maxKeys === 'number') {
          maxKeys = options.maxKeys;
        }
      
        var len = qs.length;
        // maxKeys <= 0 means that we should not limit keys count
        if (maxKeys > 0 && len > maxKeys) {
          len = maxKeys;
        }
      
        for (var i = 0; i < len; ++i) {
          var x = qs[i].replace(regexp, '%20'),
              idx = x.indexOf(eq),
              kstr, vstr, k, v;
      
          if (idx >= 0) {
            kstr = x.substr(0, idx);
            vstr = x.substr(idx + 1);
          } else {
            kstr = x;
            vstr = '';
          }
      
          k = decodeURIComponent(kstr);
          v = decodeURIComponent(vstr);
      
          if (!hasOwnProperty(obj, k)) {
            obj[k] = v;
          } else if (Array.isArray(obj[k])) {
            obj[k].push(v);
          } else {
            obj[k] = [obj[k], v];
          }
        }
      
        return obj;
      }
})