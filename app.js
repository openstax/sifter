window.addEventListener('load', () => {
    const serverRootUrl = 'https://archive-staging.cnx.org/contents'
    const bookUuids = [
        /* Algebra & Trigonometry */ '13ac107a-f15f-49d2-97e8-60ab2e3b519c',
        /* Am Gov 2e */ '9d8df601-4f12-4ac1-8224-b450bf739e5f',
        /* Anatomy & Physiology */ '14fb4ad7-39a1-4eee-ab6e-3ef2482e3e22',
        /* Astronomy */ '2e737be8-ea65-48c3-aa0a-9f35b4c6a966',
        /* Biology 2e */ '8d50a0af-948b-4204-a71d-4826cba765b8',
        /* Biology for AP Courses */ '6c322e32-9fb0-4c4d-a1d7-20c95c5c7af2',
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
    ]
    shuffle(bookUuids)

    const selectorEl = document.querySelector('#selector')
    const startEl = document.querySelector('#start')
    const stopEl = document.querySelector('#stop')
    const skipEl = document.querySelector('#skip')
    const resultsEl = document.querySelector('#results')
    const sandboxEl = document.querySelector('#sandbox')
    const stopAfterOneEl = document.querySelector('#stop-after-one')
    const bookCountEl = document.querySelector('#book-count')

    bookCountEl.textContent = bookUuids.length
    

    let isStopping = false
    let isSkipping = false

    // load the form from the URL
    if (window.location.hash.length > 1) {
        const state = JSON.parse(decodeURIComponent(window.location.hash.substring(1)))
        selectorEl.value = state.q
    }

    skipEl.addEventListener('click', () => isSkipping = true)
    stopEl.addEventListener('click', () => isStopping = true)
    const startFn = async () => {
        // For each book, fetch the ToC
        // Fetch each Page
        // Replace ` src=` with ` data-src=` so we do not fetch images
        // Inject it into a hidden element
        // Run the query
        // Remember if there was a match (maybe find the nearest id attribute)

        // update the URL so that folks can share their search
        history.pushState(null, null, `#${encodeURIComponent(JSON.stringify({q: selectorEl.value}))}`)

        // clear
        isStopping = false
        resultsEl.innerHTML = ''

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
            t1.appendChild(detailsEl)
            detailsEl.appendChild(summaryEl)
            summaryEl.appendChild(bookTitleEl)
            summaryEl.appendChild(bookLogEl)

            detailsEl.appendChild(bookResultsEl)
            resultsEl.appendChild(t1)

            const bookUrl = `${serverRootUrl}/${bookUuid}`
            const bookJson = await (await fetch(bookUrl)).json()

            bookTitleEl.textContent = bookJson.title

            const pageRefs = []
            recLeafPages(pageRefs, bookJson.tree)
    
            for (const pageRef of pageRefs) {
                // Break when stop button is pressed
                if (isStopping) {
                    startEl.disabled = false
                    stopEl.disabled = true
                    skipEl.disabled = true
                    return
                }
                if (isSkipping) {
                    break
                }
                const i = pageRefs.indexOf(pageRef)
    
                const pageUrl = `${bookUrl}:${pageRef.id}`
                const pageJson = await (await fetch(pageUrl)).json()
      
                
                const matches = findMatches(selectorEl.value, pageJson.content)
                totalMatches += matches.length
                bookLogEl.textContent = `(${i + 1}/${pageRefs.length}. Found ${totalMatches})`
    
                // Add a list of links to the matched elements
                for (const match of matches) {
                    summaryEl.classList.add('found-matches')
                    
                    const nearestId = findNearestId(match)
                    const typeOfEl = findTypeOfEl(match)
    
                    const li = document.createElement('li')
                    li.innerHTML = `${pageJson.title} <a href="${pageUrl}.html#${nearestId}">${typeOfEl}</a>`
                    bookResultsEl.appendChild(li)
                }

                if (matches.length > 0 && stopAfterOneEl.checked) {
                    // go to the next book
                    isSkipping = true
                }

            }
                
        }

        startEl.disabled = false
        stopEl.disabled = true
        skipEl.disabled = true

    }
    startEl.addEventListener('click', async () => {
        try {
            await startFn()
        } catch (err) {
            alert(err.message)
            startEl.disabled = false
            stopEl.disabled = true
            skipEl.disabled = true
        }
    })

    function recLeafPages(acc, node) {
        if (node.contents) {
            node.contents.forEach((child) => recLeafPages(acc, child))
        } else {
            acc.push(node)
        }
    }

    function findMatches(selector, html) {
        html = html.replace(/ src=/g, ' data-src=')
        sandboxEl.innerHTML = html
        return [...sandboxEl.querySelectorAll(selector)]
    }

    function findNearestId(el) {
        if (!el || el === sandboxEl) { return '' }
        const id = el.getAttribute('id')
        return id ? id : findNearestId(el.parentElement)
    }

    function findTypeOfEl(el) {
        const type = el.getAttribute('data-type')
        const cls = el.getAttribute('class')
        const id = el.getAttribute('id')
        const tagName = el.tagName
        if (type) { return type }
        if (cls) { return `${tagName}.${cls}`}
        if (id) { return `${tagName}#${id}`}
        return tagName
    }

    // https://stackoverflow.com/a/12646864
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
})