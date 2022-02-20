function init_router() {
  router = new Navigo('/', { hash: true });

  dom = new DOMHandler();
  const elements = dom.initiate().elements;
  // router.navigate('/start')

  router.updatePageLinks();
  router.on({
    '/': () => {
      router.navigate('start')
    },
    '/start': () => {
      dom.show_panels({show: ['#start'], hide: ['#play', '#finish', '#notfound']});
      dom.show_panels({show: ['#button_play_game'], hide: ['#loading_spinner']});
    },
    '/play': async () => {
      dom.show_panels({hide: ['#button_play_game'], show: ['#loading_spinner']})

      call_after_dom_update(async () => {
        await game.restart()
        dom.show_panels({show: ['#play'], hide: ['#start', '#finish', '#notfound']});
      })
    },
    '/finish/:word/': (params) => {
      game.lastword = params.data.word;
      app.last_word = params.data.word
      game.has_started = false;
      dom.show_panels({show: ['#finish'], hide: ['#play', '#start', '#notfound']});
    },
    '/notfound': () => {
      dom.show_panels({show: ['#notfound'], hide: ['#play', '#finish', '#start']});
    }
  })
  .resolve();

  router.navigate('/start')
}
