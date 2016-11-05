(() => {

  // require('es6-promise').polyfill()
  // require('isomorphic-fetch')

  // pixels + findArea function
  const findArea = () => {
    const code = document.querySelector('.js_pixels')
    if (code && code.textContent !== null) {
      let area = window.innerWidth * window.innerHeight
      area = String(area).replace(/(?=(?:\d{3})+\b)(?!\b)/g,',')
      code.textContent = area
    }
  }
  window.addEventListener('load', findArea, { passive: true })
  window.addEventListener('resize', findArea, { passive: true })

  // menu button + navigation
  const header = document.querySelector('header')
  const menuBtn = document.querySelector('.js_menu-btn')
  menuBtn.addEventListener('click', function() {
    header.classList.toggle('menu-open')
  })

  // state + page navigation
  const navItems = document.querySelectorAll('.menu-nav a')
  for (let i = 0; i < navItems.length; i++) {
    navItems[i].addEventListener('click', function(e) {
      e.preventDefault()
      header.classList.remove('menu-open')
      if (e.currentTarget.pathname !== location.pathname) {
        history.pushState(null, null, e.currentTarget.pathname)
        updatePage()
      }
    })
  }

  window.addEventListener('popstate', updatePage)

  const main = document.querySelector('main')
  function updatePage() {
    const url = window.location.href
    loadPage(url).then((responseText) => {
      const wrapper = document.createElement('div')
      wrapper.innerHTML = responseText
      const oldPage = document.querySelector('.page')
      const newPage = wrapper.querySelector('.page')
      main.appendChild(newPage)
      animate(oldPage, newPage)
      document.title = wrapper.getElementsByTagName('title')[0].innerHTML
      if (location.pathname === '/' || location.pathname === '/index.html') {
        findArea()
      }
    })
  }

  // fetch get + load + cache new url
  const cache = {}
  function loadPage(url) {
    if (cache[url]) {
      return Promise.resolve(cache[url])
    }
    return fetch(url)
      .then((response) => {
        if (response.ok) {
          cache[url] = response.text()
          return cache[url]
        } else {
          console.log('network response was not ok.')
        }
      })
      .catch((err) => console.log(`there has been an error requesting (${url}): ${err.message}`))
  }

  // animate old page out + new page in
  function animate(oldPage, newPage) {
    oldPage.style.position = 'absolute'
    const fadeOut = oldPage.animate({
      opacity: [1,0]
    },1000)
    const fadeIn = newPage.animate({
      opacity: [0,1]
    },1000)
    fadeIn.onfinish = function() {
      oldPage.parentNode.removeChild(oldPage)
    }
  }

  // scroll to top
  const topArrow = document.querySelector('.top')
  topArrow.addEventListener('click', function() {
    scrollToTop(this.parentNode)
  })
  function scrollToTop(el) {
    if (el.scrollTop !== 0) {
      setTimeout(function() {
        el.scrollTop = el.scrollTop - 25
        scrollToTop(el)
      },0)
    }
  }

})()
