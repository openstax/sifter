window.addEventListener('load', () => {
     const TESTED_ABL_VERSION = 2
     const ablUrl = 'https://raw.githubusercontent.com/openstax/content-manager-approved-books/main/approved-book-list.json'
     const openstaxGithubURL = 'https://openstax.github.io'
     const githubServerURL = 'https://github.com/openstax/'
     const s3RootUrl = 'https://openstax.org/apps/archive'
     const rexPreviewPrefix = 'https://rex-web.herokuapp.com/books'
     const namespacePrefixes = {
          'c' : 'http://cnx.rice.edu/cnxml',
          'cnx' : 'http://cnx.rice.edu/cnxml',
          'h' : 'http://www.w3.org/1999/xhtml',
          'xhtml' : 'http://www.w3.org/1999/xhtml',
          'm' : 'http://www.w3.org/1998/Math/MathML',
          'mml' : 'http://www.w3.org/1998/Math/MathML',
          'mathml' : 'http://www.w3.org/1998/Math/MathML'
     }

     const qs = (sel) => {
          const el = document.querySelector(sel)
          if (!el) {
               throw new Error(`BUG: Could not find "${sel}"`)
          }
          return el
     }
     
     const selectorEl = qs('#selector')
     const startEl = qs('#start')
     const stopEl = qs('#stop')
     const skipEl = qs('#skip')
     const resultsEl = qs('#results')
     const sandboxEl = qs('#sandbox')
     const bookCountEl = qs('#book-count')
     const booksEl = qs('#books')
     const validationMessageEl = qs('#validation-message')
     const form = qs('form')
     const sourceFormat = form.elements['sourceFormat']
     
     const errors = qs('#errors')
     const errorLogLabel = qs('#errorLogLabel')
     const resultsLabel = qs('#resultsLabel')
     
     const bookUrlInfoMapping = new Map() // Map<url, repoOrSlug>
     let isStopping = false
     let isSkipping = false
     bookCountEl.setAttribute('href', ablUrl)
     
     const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
     
     function dom(tagName, attrs = {}, children = [], handlers = {}) {
          let el
          // The first argument can be a string or an element
          if (typeof tagName === 'string')
               el = document.createElement(tagName)
          else
               el = tagName
          for (const [key, value] of Object.entries(attrs))
               el.setAttribute(key, value)
          for (const [key, value] of Object.entries(handlers))
               el.addEventListener(key, value)
          el.innerHTML = '' // clear the children
          for (const child of children)
               el.append(child)
          return el
     }

     function* times(x) {
          for (var i = 0; i < x; i++) yield i;
     }
     
     async function fetchWithBackoff(url, useJson) {
          for (var _ of times(2)) {
               try {
                    return await fetchWithError(url, useJson)
               } catch (err) {
                    error(err, url)
                    console.error(`${err}: ${url}`)
               }
               await sleep(300)
          }
          return null
     }
     
     function error(err, url) {
          errorLogLabel.classList = ''
          let li = document.createElement('li')
          let time = new Date().toLocaleTimeString()
          if (url) {
               li.innerHTML = `${time} ::: ${err}: <a href="${url}">${url}</a>`
          } else {
               li.innerHTML = `${time} ::: ${err}`
          }
          errors.append(li)
     }
     
     async function fetchWithError(url, useJSON) {
          try {
               let response = await fetch(url)
               if (!response.ok) // or check for response.status
                    throw new Error(response.statusText);
               if (useJSON)
                    return await response.json();
               else
                    return await response.text();
               // process body
          } catch (err) {
               console.log(err)
               throw new Error(err)
          }
     };
     
     let isValid = false
     
     function getSelectedBookUrls() {
          return Array.from(booksEl.querySelectorAll("option:checked"), e => e.value)
     }
     
     const getValidationMessage = () => {
          if (sourceFormat.value !== 'xhtml' && sourceFormat.value !== 'cnxml') {
               return 'Choose a format to search: XHTML or CNXML'
          }
          if (getSelectedBookUrls().length === 0) {
               return 'Select at least one book'
          }
          const selector = selectorEl.value
          // validate it as an XPath (ensure it begins with "/h:" or "//h:")
          if (/^\/{1,2}[h,c,m]:/.test(selector)) {
               try {
                    document.evaluate(selector, sandboxEl, xpathNamespaceResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
                    return '' // valid!
               } catch (e) {
                    return 'Malformed XPath selector'
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
     skipEl.addEventListener('click', (e) => {
          e.preventDefault();
          isSkipping = true
     })
     stopEl.addEventListener('click', (e) => {
          e.preventDefault();
          isStopping = true
     })
     sourceFormat.forEach(el => {
          el.addEventListener('change', e => {
               if (el.checked) populateBookList()
          })
     })
     const relativeHref = (baseFile, href) => {
          return new URL(href, baseFile).toString()
     }

     const getPageUrls = async (format, bookUrl, bookInfo) => {
          if (format === 'xhtml') {
               const bookJson = await fetchWithBackoff(bookUrl, true)
               if (bookJson === null) {
                    throw new Error(`BUG: Could not find the book even though this URL worked earlier when building the book list ${bookUrl}`)
               }
               const pageUuids = []
               recLeafPages(pageUuids, bookJson.tree)
               const pageUrls = pageUuids.map(pageUuid => {
                    const parseUrl = bookUrl.replace('.json', `:${pageUuid.replace('@', '')}.json`)
                    const viewUrl = `${rexPreviewPrefix}/${bookInfo.uuid}@${bookInfo.shortSha}/pages/${pageUuid}?archive=${s3RootUrl}/${bookInfo.pipeline}`
                    return {parseUrl, viewUrl}
               })
               return pageUrls
          } else if (format === 'cnxml') {
               const metaInfBooksXml = await fetchWithBackoff(bookUrl, false)
               sandboxEl.innerHTML = metaInfBooksXml.replace(/ src=/g, ' data-src=')
               //List of collection.xml files
               const collectionXMLLinks = Array.from(sandboxEl.querySelectorAll("book[href]"), e => e.attributes.getNamedItem('href').value)
               const bookUrls = collectionXMLLinks.map(href => relativeHref(bookUrl, href))
               const pageUrls = []
               for (const collectionXMLUrl of bookUrls) {
                    const collectionXML = await fetchWithBackoff(collectionXMLUrl, false)
                    sandboxEl.innerHTML = collectionXML
                    sandboxEl.querySelectorAll('[document]').forEach(module => {
                         const parseUrl = new URL(relativeHref(collectionXMLUrl, `../modules/${module.getAttribute('document')}/index.cnxml`))
                         const paths = parseUrl.pathname.split('/')
                         // paths[0] is always '' because .pathname begins with `/`
                         const repoName = paths[1]
                         const restOfPath = paths.slice(2).join('/')
                         const viewUrl = `${githubServerURL}/${repoName}/tree/main/${restOfPath}`
                         pageUrls.push({parseUrl: parseUrl.toString(), viewUrl})
                    })
               }
               return pageUrls
          }
     }
     const getPageXML = async (format, pageUrl) => {
          if (format === 'xhtml') {
               const page = await fetchWithBackoff(pageUrl, true)
               if (page)
                    return {
                         title: page.slug,
                         source: page.content
                    }
               else
                    return {}
          } else if (format === 'cnxml') {
               return {
                    source: await fetchWithBackoff(pageUrl, false)
               }
          }
     }
     const startFn = async () => {
          // For each book, fetch the ToC
          // Fetch each Page
          // Replace ` src=` with ` data-src=` so we do not fetch images
          // Inject it into a hidden element
          // Run the query
          // Remember if there was a match (maybe find the nearest id attribute)
          
          const selector = selectorEl.value
          
          const selectedUrls = getSelectedBookUrls()
          
          resultsLabel.classList = ''
          
          // clear
          isStopping = false
          resultsEl.innerHTML = ''
          errors.innerHTML = ''
          
          selectorEl.disabled = true
          startEl.disabled = true
          booksEl.disabled = true
          stopEl.disabled = false
          skipEl.disabled = false
          sourceFormat.forEach(el => {
               el.disabled = true
          })
          
          // these are done in parallel
          for (const bookUrl of selectedUrls) {
               if (isStopping) break

               const pageUrls = await getPageUrls(sourceFormat.value, bookUrl, bookUrlInfoMapping.get(bookUrl)) // Array<{parseUrl, viewUrl}>

               //Find the book type
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

               
               for (let i = 0; i < pageUrls.length; i++) {
                    if (isStopping || isSkipping) break

                    const {parseUrl, viewUrl} = pageUrls[i]
                    const {title, source} = await getPageXML(sourceFormat.value, parseUrl)
                    if (!source) {
                         error(`Could not fetch ${parseUrl}`)
                         detailsEl.append(dom('li', {}, `Error: Could not fetch ${parseUrl}`))
                         continue
                    }

                    const matches = findMatches(selector, source)
                    const pageTitleEl = sandboxEl.querySelector("title") // findMatches populates sandboxEl
                    let pageTitle = title ? title : pageTitleEl ? pageTitleEl.innerHTML : parseUrl
                    totalMatches += matches.length
                    bookLogEl.textContent = `${bookUrlInfoMapping.get(bookUrl)?.slug || bookUrl} (${i + 1}/${pageUrls.length}. Found ${totalMatches})`
                    // Add a list of links to the matched elements
                    for (const match of matches) {
                         detailsEl.classList.add('found-matches')
                         
                         const nearestId = findNearestId(match)
                         const nodeValue = getNodeValue(match)
                         
                         const li = document.createElement('li')
                         try {
                              li.innerHTML = `<a target="_blank" href="${viewUrl}#${nearestId}">${pageTitle} : ${nodeValue}</a>`
                         } catch (e) {
                              error('Invalid XML', parseUrl)
                              continue
                         }
                         bookResultsEl.append(li)
                    }
               }
          }
          
          selectorEl.disabled = false
          startEl.disabled = false
          booksEl.disabled = false
          stopEl.disabled = true
          skipEl.disabled = true
          sourceFormat.forEach(el => {
               el.disabled = false
          })
          
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
                    error(err.message)
                    console.error(err.message)
                    alert(`Error: ${err.message}`)
                    selectorEl.disabled = false
                    startEl.disabled = false
                    stopEl.disabled = true
                    skipEl.disabled = true
                    sourceFormat.forEach(el => {
                         el.disabled = false
                    })
               })
          }
     }
     
     let loadedRepos = null // Array<{repoName, url, error?: string}>
     let loadedBooks = null // Map<slug, url>
     let failedBooks = null // Map<slug, {commit_sha, uuid, pipeline, url, error?: string}>
     fetch(ablUrl).then(async res => {
          const approvedBookList = await res.json()
          console.log('Here is the approved book list:', approvedBookList)
          if (approvedBookList.api_version !== TESTED_ABL_VERSION) {
               alert(`Sifter is tested to work with ABL version ${TESTED_ABL_VERSION} but the current api_version is '${approvedBookList.api_version}'. Stuff may not work`)
          }
          const ablRepos = new Set() // Set<string>
          const ablBookSlugCommitPairs = new Set() // Set<{slug, uuid, commit_sha}>
          const ablPipelines = new Set() // Set<string>
          
          // collect all the books & remember if they are archive/git
          approvedBookList.approved_books.forEach(bookContainer => {
               if (bookContainer.repository_name) {
                    ablRepos.add(bookContainer.repository_name)
                    bookContainer.versions.forEach(v => {
                         ablPipelines.add(v.min_code_version)
                         v.commit_metadata.books.forEach(book => {
                              ablBookSlugCommitPairs.add({slug: book.slug, uuid: book.uuid, commit_sha: v.commit_sha})
                         })
                    })
               } else {
                    error("Unsupported approved_book format", ablUrl)
               }
          })
          const ablPipelinesSorted = Array.from(ablPipelines).sort((a, b) => {
               return a < b ? 1 : (a > b ? -1 : 0)
          })

          // Load the books to check & see which ones are not even valid (like a missing GH-Pages, or not generated in the most-recent pipeline)
          
          loadedRepos = [] // Array<{repoName, url, error?: string}>
          for (const repoName of ablRepos) {
               const url = `${openstaxGithubURL}/${repoName}/META-INF/books.xml`
               const metaInfBooksXml = await fetchWithBackoff(url, false)
               if (metaInfBooksXml) {
                    loadedRepos.push({repoName, url})
               } else {
                    loadedRepos.push({repoName, url, error: `Enable GitHub Pages`})
               }
          }
          loadedBooks = new Map() // Map<slug, {url}>
          failedBooks = new Map() // Map<slug, {url, error: string|null}>
          for (const pipeline of ablPipelinesSorted) {
               for (const {slug, uuid, commit_sha} of ablBookSlugCommitPairs) {
                    if (!loadedBooks.has(slug)) {
                         const shortSha = commit_sha.substring(0, 7)
                         const url = `${s3RootUrl}/${pipeline}/contents/${uuid}@${shortSha}.json`
                         const bookJson = await fetchWithBackoff(url, true)
                         if (bookJson) {
                              loadedBooks.set(slug, {url, pipeline, uuid, shortSha})
                              failedBooks.delete(slug)
                         } else {
                              failedBooks.set(slug, {url, error: 'Could not find book in S3'})
                         }
                    }
               }
          }

          populateBookList()
          
          bookCountEl.textContent = ablRepos.size
          validateSelector()
          
     }, err => alert(`Problem getting the approved book list. Maybe you are offline or the URL has moved. '${ablUrl}'`))
     
     const compareStrings = (a, b) => a < b ? -1 : a > b ? 1 : 0
     const compareKeys = ([a], [b]) => compareStrings(a, b)
     const compareRepoNames = ({repoName: a}, {repoName: b}) => compareStrings(a, b)
     async function populateBookList() {
          if (sourceFormat.value === 'xhtml') {
               const loadedAndFailedBooks = [
                    ...failedBooks,
                    ...loadedBooks
               ]
               dom(booksEl, {}, loadedAndFailedBooks.sort(compareKeys).map(([slug, {url, pipeline, uuid, shortSha, error}]) => {
                    bookUrlInfoMapping.set(url, {slug, url, pipeline, uuid, shortSha})
                    if (error)
                         return dom('option', {value: url, disabled: true}, [`${slug} Error: ${error}`])
                    else
                         return dom('option', {value: url, selected: true}, [slug])
               }))
          } else if (sourceFormat.value === 'cnxml') {
               dom(booksEl, {}, loadedRepos.sort(compareRepoNames).map(({repoName, url, error}) => {
                    bookUrlInfoMapping.set(url, {slug: repoName})
                    if (error)
                         return dom('option', {value: url, disabled: true}, [`${repoName} Error: ${error}`])
                    else
                         return dom('option', {value: url, selected: true}, [repoName])
               }))
          } else {
               error(`Unsupported sourceFormat: ${sourceFormat.value}`)
          }
     }

     function recLeafPages(acc, node) {
          if (node.contents) {
               node.contents.forEach((child) => recLeafPages(acc, child))
          } else if (node.id.endsWith('@')) { // Autogenerated Pages end with '@{sha}' instead of '@' for some reason
               acc.push(node.id.replace('@', ''))
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
               if (/^\/{1,2}[h,c,m]:/.test(selector) || /^\/\/\*/.test(selector)) {
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
                    return [ ...sandboxEl.querySelectorAll(selector) ]
               } catch (err) {
                    alert('Malformed CSS selector. Try again.')
                    throw new Error(`Malformed selector: "${selector}"`)
               }
          }
     }
     
     function findNearestId(el) {
          if (!el || el === sandboxEl) {
               return ''
          }
          return (el.getAttribute && el.getAttribute('id')) || findNearestId(el.parentElement)
     }
     
     function getNodeValue(node) {
          switch (node.nodeType) {
               case Node.ATTRIBUTE_NODE:
                    return node.value
               default:
                    return findTypeOfEl(node)
          }
     }
     
     
     function findTypeOfEl(el) {
          if (el.getAttribute) {
               const type = el.getAttribute('data-type')
               const cls = el.getAttribute('class')
               const id = el.getAttribute('id')
               const tagName = el.tagName
               if (type) {
                    return type
               }
               if (cls) {
                    return `${tagName}.${cls}`
               }
               if (id) {
                    return `${tagName}#${id}`
               }
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
               var x = qs[i].replace(regexp, '%20'), idx = x.indexOf(eq), kstr, vstr, k, v;
               
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
                    obj[k] = [ obj[k], v ];
               }
          }
          
          return obj;
     }
})