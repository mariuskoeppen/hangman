function init_vue() {
  app = Vue.createApp({
    data() {
      return {
        game,
        prediction_char: '',
        word_length: 5,
        wordHasNoChar: true,
        timesGuessed: 0,
        last_word: '',
        remaining_words: [],
        analysis: []
      }
    },
    methods: {
        start_game: async function(event) {
          game.start();
        },
        char_clicked: (e) => {
          game.char_clicked(e);
        },
        proceed_without_selection: () => {
          game.no_char_selected();
        },
        all_chars_selected: () => {
          game.all_chars_selected();
        },
        add_length: (val) => {
          app.word_length += val
        },
        change_char: (event) => {
          const target = event.path.find(e => e.classList.contains('analysis_character'))

          if(!target) return null;

          const char = target.dataset.characterChar

          app.prediction_char = char;
        }
      }
  }).mount('#app')
}
