window.addEventListener('load', () => {
     const TESTED_ABL_VERSION = 2
     const ablUrl = '/content-manager-approved-books/approved-book-list.json'
     const legacyServerRootUrl = 'https://archive-staging.cnx.org/contents'
     const legacyRoot = 'https://legacy.cnx.org/content'
     const openstaxGithubURL = 'https://openstax.github.io'
     const githubServerURL = 'https://github.com/openstax/'
     const s3RootUrl = 'https://openstax.org/apps/archive'
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
     const stopAfterOneEl = qs('#stop-after-one')
     const bookCountEl = qs('#book-count')
     const analyzeCodeEl = qs('#analyze-code')
     const stopAfterNPages = qs('#stop-after-n-pages')
     const booksEl = qs('#books')
     const validationMessageEl = qs('#validation-message')
     const form = qs('form')
     const sourceFormat = form.elements['sourceFormat']
     
     const errors = qs('#errors')
     const errorLogLabel = qs('#errorLogLabel')
     const resultsLabel = qs('#resultsLabel')
     
     let isStopping = false
     let isSkipping = false
     bookCountEl.setAttribute('href', ablUrl)
     
     const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
     
     function* times(x) {
          for (var i = 0; i < x; i++) yield i;
     }
     
     async function fetchWithBackoff(url, useJson) {
     
          for (var _ of times(3)) {
               try {
                    return await fetchWithError(url, useJson)
               } catch (err) {
                    printErrorToUser(err, url)
                    console.error(`${err}: ${url}`)
               }
               await sleep(300)
          }
          try {
               return await fetchWithError(url, useJson)
          } catch (err) {
               console.error(err)
               console.log(`Bad url ${url}`)
               printErrorToUser(err, url)
          }
     }
     
     function printErrorToUser(err,url){
          let li = document.createElement('li')
          
          
          let time = new Date().toLocaleTimeString()
          if(url)
               li.innerHTML = `${time} ::: ${err}: <a href="${url}">${url}</a>`
          else
               li.innerHTML = `${time} ::: ${err}`
          errors.append(li)
     }
     async function fetchWithError(url, useJSON) {
          try {
               let response = await fetch(url)
               if (!response.ok) // or check for response.status
                    throw new Error(response.statusText);
               if(useJSON)
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
     skipEl.addEventListener('click', (e) => {
          e.preventDefault();
          isSkipping = true
     })
     stopEl.addEventListener('click', (e) => {
          e.preventDefault();
          isStopping = true
     })
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
          
          resultsLabel.classList = ''
          errorLogLabel.classList = ''
          
          // clear
          isStopping = false
          resultsEl.innerHTML = ''
          errors.innerHTML = ''
          
          selectorEl.disabled = true
          startEl.disabled = true
          booksEl.disabled = true
          stopEl.disabled = false
          skipEl.disabled = false
          
          // these are done in parallel
          for (const bookUuid of bookUuids) {
               //Retrieve the book object from local storage
               const book = JSON.parse(window.localStorage.getItem(bookUuid))
               //Find the book type
               const bookType = book.repository_name ? 'github' : (book.collection_id ? 'legacy' : null)
               if (!bookType) continue
               const legacyBook = bookType === 'legacy'
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
               
               let bookUrl = legacyBook ? `${legacyServerRootUrl}/${book.books[0].uuid}` : null
               let bookJson = null
               let collectionXMLLinks
               if (!legacyBook) {
                    //Download the book.xml from Github
                    bookXML = await fetchWithBackoff(`${openstaxGithubURL}/${book.repository_name}/META-INF/books.xml`, false)
                    sandboxEl.innerHTML = bookXML.replace(/ src=/g, ' data-src=')
                    //List of collection.xml files
                    collectionXMLLinks = Array.from(sandboxEl.querySelectorAll("book[href]"), e => e.attributes.getNamedItem('href').value)
                    const pipelines = JSON.parse(window.localStorage.getItem('pipelines'))
                    const commit_shas = []
                    book.versions.forEach(v => commit_shas.push(v.commit_sha.substring(0, 7)))
                    for (let pipeline of pipelines) {
                         for (let commitSha of commit_shas) {
                              bookUrl = `${s3RootUrl}/${pipeline}/contents/${bookUuid}@${commitSha}.json`
                              try {
                                   //Find the right book.json file and exit the loop
                                   bookJson = await fetchWithBackoff(bookUrl, true)
                                   if (bookJson!=null && bookJson.title!=null) break
                              } catch (error) {
                                   console.error(error)
                                   continue;
                              }
                         }
                         if (bookJson!=null && bookJson.title!=null) break
                    }
               } else bookJson = await fetchWithBackoff(bookUrl, true)
               
               
               analyzeFn('BOOK:START', bookJson, bookUuid)
               
               
               if (bookJson == null) {
                    printErrorToUser(`Could not find a baked version of ${bookUuid}. Book details: ${JSON.stringify(book)}`,null)
                    continue
               }
               bookTitleEl.textContent = bookJson.title
               bookUrl = bookUrl.replace('.json', '')
               //Currently trying to merge the cnxml process for legacy with the one for Github books. Will get back to this later
               if (!legacyBook && sourceFormat.value === 'cnxml') {
                    for (let link of collectionXMLLinks) {
                         link = link.replace("../", "")
                         let collectionXML = await fetchWithBackoff(`${openstaxGithubURL}/${book.repository_name}/${link}`, false)
                         sandboxEl.innerHTML = collectionXML.replace(/ src=/g, 'data-src')
                         let modules = Array.from(sandboxEl.querySelectorAll("module[document]"), e => e.attributes.getNamedItem('document').value)
                         for (let module of modules) {
                              const i = modules.indexOf(module)
                              let indexCNXMLLink = `${openstaxGithubURL}/${book.repository_name}/modules/${module}/index.cnxml`
                              let indexCNXML = await fetchWithBackoff(indexCNXMLLink, false)
                              sandboxEl.innerHTML = indexCNXML
                              let pageTitle = sandboxEl.querySelector("title").innerHTML
                              const matches = findMatches(selector, indexCNXML)
                              totalMatches += matches.length
                              bookLogEl.textContent = `(${i + 1}/${modules.length}. Found ${totalMatches})`
                              // Add a list of links to the matched elements
                              for (const match of matches) {
                                   detailsEl.classList.add('found-matches')
                                   
                                   const nearestId = findNearestId(match)
                                   const nodeValue = getNodeValue(match)
                                   
                                   const li = document.createElement('li')
                                   //Issue With how to rewrite the redirection URL to the right cnxml file attribute
                                   const moduleInfo = `<a target="_blank" href="${githubServerURL}/${book.repository_name}/blob/main/modules/${module}/index.cnxml#${nearestId}">${module}</a> `
                                   try {
                                        li.innerHTML = `${moduleInfo}${pageTitle} <a target="_blank" href="${githubServerURL}/${book.repository_name}/blob/main/modules/${module}/index.cnxml#${nearestId}">${nodeValue}</a>`
                                   } catch (e) {
                                        console.error(e)
                                        console.log('invalid XML')
                                        continue
                                   }
                                   bookResultsEl.append(li)
                              }
                              
                         }
                    }
               } else {
                    
                    const pageRefs = []
                    recLeafPages(pageRefs, bookJson.tree)
                    
                    for (const pageRef of pageRefs) {
                         try {
                              const i = pageRefs.indexOf(pageRef)
                              
                              // Check this in the loop so that users can update the value while this is running
                              let stopAfterNPagesCount = Number.parseInt(stopAfterNPages.value)
                              if (Number.isNaN(stopAfterNPagesCount)) {
                                   stopAfterNPagesCount = Number.POSITIVE_INFINITY
                              }
                              if (i >= stopAfterNPagesCount) {
                                   break
                              }
                              pageRef.id = !legacyBook ? pageRef.id.replace("@", '') : pageRef.id
                              const pageUrl = `${bookUrl}:${pageRef.id}` + (!legacyBook ? '.json' : '')
                              const pageJson = await fetchWithBackoff(`${pageUrl}`, true)
                              
                              analyzeFn('PAGE', pageJson, bookUuid, pageRef.id)
                              
                              let sourceCode
                              if (legacyBook && sourceFormat.value === 'cnxml') {
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
                                   const moduleInfo = legacyBook ? (pageJson.legacy_id ? `<a target="_blank" href="${legacyRoot}/${pageJson.legacy_id}/latest/#${nearestId}">${pageJson.legacy_id}</a> ` : '') : ''
                                   
                                   try {
                                        li.innerHTML = legacyBook ? `${moduleInfo}${pageJson.title} <a target="_blank" href="${pageUrl}.html#${nearestId}">${nodeValue}</a>` : `${pageJson.title} <a target="_blank" href="${pageUrl}.xhtml#${nearestId}">${nodeValue}</a>`
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
                         } catch (error) {
                              console.error(error)
                              continue
                         }
                         
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
          if (approvedBookList.api_version !== TESTED_ABL_VERSION) {
               alert(`Sifter is tested to work with ABL version ${TESTED_ABL_VERSION} but the current api_version is '${approvedBookList.api_version}'. Stuff may not work`)
          }
          const bookIdAndSlugs = [] // {uuid, slug, collection_id}
          const pipelines = []
          
          // collect all the books & remember if they are archive/git
          approvedBookList.approved_books.forEach(bookContainer => {
               if (bookContainer.repository_name) {
                    bookContainer.versions.forEach(v => {
                         if (pipelines.indexOf(v.min_code_version) === -1) pipelines.push(v.min_code_version)
                         v.commit_metadata.books.forEach(book => {
                              bookIdAndSlugs.push({...bookContainer, ...book})
                              window.localStorage.setItem(book.uuid, JSON.stringify(bookContainer))
                         })
                    })
               } else if (bookContainer.collection_id) {
                    bookContainer.books.forEach(book => {
                         bookIdAndSlugs.push({...bookContainer, ...book})
                         window.localStorage.setItem(book.uuid, JSON.stringify(bookContainer))
                    })
               } else {
                    console.error("Unsupported approved_book format")
               }
          })
          // sort by Book slug
          bookIdAndSlugs.sort((a, b) => {
               if (a.slug.toLowerCase() < b.slug.toLowerCase()) return -1
               if (a.slug.toLowerCase() > b.slug.toLowerCase()) return 1
               return 0
          })
          pipelines.sort((a, b) => {
               return a < b ? 1 : (a > b ? -1 : 0)
          })
          window.localStorage.setItem('pipelines', JSON.stringify(pipelines))
          bookIdAndSlugs.forEach(({uuid, slug, collection_id}) => {
               const o = document.createElement('option')
               o.setAttribute('value', uuid)
               o.setAttribute('selected', 'selected')
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