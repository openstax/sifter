window.addEventListener('load', () => {
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
    const bookUuids = [
        /* Algebra & Trigonometry */ '13ac107a-f15f-49d2-97e8-60ab2e3b519c',
        /* Am Gov 2e */ '9d8df601-4f12-4ac1-8224-b450bf739e5f',
        /* Anatomy & Physiology */ '14fb4ad7-39a1-4eee-ab6e-3ef2482e3e22',
        /* Astronomy */ '2e737be8-ea65-48c3-aa0a-9f35b4c6a966',
        /* Biology for AP Courses */ '6c322e32-9fb0-4c4d-a1d7-20c95c5c7af2',
        /* Biology 2e */ '8d50a0af-948b-4204-a71d-4826cba765b8',
        /* Business Ethics */ '914ac66e-e1ec-486d-8a9c-97b0f7a99774',
        /* Business statistics */ 'b56bb9e9-5eb8-48ef-9939-88b1b12ce22f',
        /* Business in Law I */ '464a3fba-68c1-426a-99f9-597e739dc911',
        /* Calculus vol 1 */ '8b89d172-2927-466f-8661-01abc7ccdba4',
        /* Calculus vol 2 */ '1d39a348-071f-4537-85b6-c98912458c3c',
        /* Calculus vol 3 */ 'a31cd793-2162-4e9e-acb5-6e6bbd76a5fa',
        /* Chemistry 2e */ '7fccc9cf-9b71-44f6-800b-f9457fd64335',
        /* Chemistry: Atoms First 2e */ 'd9b85ee6-c57f-4861-8208-5ddf261e9c5f',
        /* College Algebra */ '9b08c294-057f-4201-9f48-5d6ad992740d',
        /* College Physics */ '031da8d3-b525-429c-80cf-6c8ed997733a',
        /* College Physics for AP */ '8d04a686-d5e8-4798-a27d-c608e4d0e187',
        /* College Success */ 'e8668a14-9a7d-4d74-b58c-3681f8351224',
        /* Concepts of Biology */ 'b3c1e1d2-839c-42b0-a314-e119a8aafbdd',
        /* Elementary Algebra 2e */ '55931856-c627-418b-a56f-1dd0007683a8',
        /* Entrepreneurship */ 'd380510e-6145-4625-b19a-4fa68204b6b1',
        /* Intermediate Algebra 2e */ '4664c267-cd62-4a99-8b28-1cb9b3aee347',
        /* Introduction to Business */ '4e09771f-a8aa-40ce-9063-aa58cc24e77f',
        /* Introduction to Sociology 2e */ '02040312-72c8-441e-a685-20e9333f3e1d',
        /* Introductory Statistics */ '30189442-6998-4686-ac05-ed152b91b9de',
        /* Microbiology */ 'e42bd376-624b-4c0f-972f-e0c57998e765',
        /* Organizational Behavior */ '2d941ab9-ac5b-4eb8-b21c-965d36a4f296',
        /* Psychology 1e */ '4abf04bf-93a0-45c3-9cbc-2cefd46e68cc',
        /* Psychology 2e */ '06aba565-9432-40f6-97ee-b8a361f118a8',
        /* Prealgebra 2e */ 'f0fa90be-fca8-43c9-9aad-715c0a2cee2b',
        /* Precalculus */ 'fd53eae1-fa23-47c7-bb1b-972349835c3c',
        /* Principles of Accounting Vol 1 */ '9ab4ba6d-1e48-486d-a2de-38ae1617ca84',
        /* Principles of Accounting Vol 2 */ '920d1c8a-606c-4888-bfd4-d1ee27ce1795',
        /* Principles of MicroEcon for AP courses 2e */ '636cbfd9-4e37-4575-83ab-9dec9029ca4e',
        /* Principles of MacroEcon for AP courses 2e */ '9117cf8c-a8a3-4875-8361-9cb0f1fc9362',
        /* Principles of Economics 2e */ 'bc498e1f-efe9-43a0-8dea-d3569ad09a82',
        /* Principles of Macroeconomics 2e */ '27f59064-990e-48f1-b604-5188b9086c29',
        /* Principles of Management */ 'c3acb2ab-7d5c-45ad-b3cd-e59673fedd4e',
        /* Principles of Microeconomics 2e */ '5c09762c-b540-47d3-9541-dda1f44f16e5',
        /* Statistics (High School) */ '394a1101-fd8f-4875-84fa-55f15b06ba66',
        /* US History */ 'a7ba2fb8-8925-4987-b182-5f4429d48daa',
        /* University Physics vol 1 */ 'd50f6e32-0fda-46ef-a362-9bd36ca7c97d',
        /* University Physics vol 2 */ '7a0f9770-1c44-4acd-9920-1cd9a99f2a1e',
        /* University Physics vol 3 */ 'af275420-6050-4707-995c-57b9cc13c358',

        /* Polish Physics 1 */ '4eaa8f03-88a8-485a-a777-dd3602f6c13e',
        /* Polish Physics 2 */ '16ab5b96-4598-45f9-993c-b8d78d82b0c6',
        /* Polish Physics 3 */ 'bb62933e-f20a-4ffc-90aa-97b36c296c3e',

    ]

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
    const form = qs('form')
    const sourceFormat = form.elements['sourceFormat']

    bookCountEl.textContent = bookUuids.length
    

    let isStopping = false
    let isSkipping = false

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
        if (useJson) {
            return fetchJson(url)
        } else {
            return fetchText(url)
        }
    }
    const fetchJson = async (url) => (await fetch(url)).json() 
    const fetchText = async (url) => (await fetch(url)).text() 

    let isValid = false
    const getValidationMessage = () => {
        if (sourceFormat.value !== 'xhtml' && sourceFormat.value !== 'cnxml') {
            return 'Choose a format to search: XHTML or CNXML'
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
    }
    selectorEl.addEventListener('input', validateSelector)
    selectorEl.addEventListener('keyup', validateSelector)
    form.addEventListener('change', validateSelector)

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

        // clear
        isStopping = false
        resultsEl.innerHTML = ''

        selectorEl.disabled = true
        startEl.disabled = true
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
                    li.innerHTML = `${moduleInfo}${pageJson.title} <a target="_blank" href="${pageUrl}.html#${nearestId}">${nodeValue}</a>`
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
        stopEl.disabled = true
        skipEl.disabled = true

    }

    // load the form from the URL
    if (window.location.hash.length > 1) {
        const state = JSON.parse(decodeURIComponent(window.location.hash.substring(1)))
        selectorEl.value = state.q
        if (state.code) {
            analyzeCodeEl.value = state.code
        }
        validateSelector()
    }
    if (window.location.search.length > 1) {
        const args = querystring(window.location.search.substring(1))
        for (const el of form.elements) {
            const key = el.name
            if (args[key]) {
                form.elements[key].value = args[key]
            }
        }
        validateSelector()
    }

    // Run!
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