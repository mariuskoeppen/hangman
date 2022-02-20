class Game {
  constructor() {
    this.analyser = new WordAnalyser();
    this.manager = new WordManager();
    this.history_manager = new HistoryManager();

    this.has_started = false;
    this.chars_selected_indeces = [];

    this.guessed_indeces = [];

    this.gamestateskip = true;
    this.lastword = '';
    this.timesguessed = 0;
    this.wrong_chars = [];
    this.guessed_chars = [];
    this.estimated_moves_left = Infinity;
  }

  async start() {
    // Reset some things
    this.prepare_guess();

    // Check if words are already fetched, otherwise fetch
    const words = await this.manager.get_words();

    // Apply first filter
    const word_rules = {
      chars_not_allowed: [...unwanted_characters],
    }

    const filtered_words = await this.manager.filter_words(word_rules, words);

    // Make first guess
    const guess = await this.guess_char();
    this.has_started = true;

    //return guess;
  }

  async guess_char(words = this.manager.remaining_words) {
    // Check if there is only one word left
    if(this.manager.remaining_words.length == 0) {
      console.log("No words left")
      // navigate to page that theres no word left
      router.navigate('/notfound/');
    } else if(this.manager.remaining_words.length == 1) {
      // Navigate to finish page
      const word = this.manager.remaining_words[0];
      router.navigate('/finish/' + word);
    } else {
      // Analyse words
      //const analysis = await this.analyser.analyse_batches(words, {ignore_characters: [...this.guessed_chars]});

      // Make a prediction
      const prediction = await this.analyser.analyse_better(words);
      console.log(prediction);
      this.timesguessed++;
      app.timesGuessed++

      this.guessed_chars.push(prediction.character);
      // this.estimated_moves_left = Math.min(analysis.information_gain.size - this.guessed_chars.length + this.wrong_chars.length, this.manager.remaining_words.length - 1);

      return prediction.character;
    }
  }

  async restart() {
    // Reset character inputs
    const character_inputs = document.querySelectorAll('.input_char');
    for(let el of character_inputs) {
      el.value = '';
      el.classList.remove('highlighted');
    }

    this.history_manager.clear();

    this.lastword = '';
    app.prediction_char = '';
    this.timesguessed = 0;
    app.timesGuessed = 0
    this.wrong_chars = [];
    this.guessed_chars = [];
    this.estimated_moves_left = Infinity;
    this.guessed_indeces = [];


    return this.start();
  }

  prepare_guess() {
    this.chars_selected_indeces = [];
    const char_inputs = document.querySelectorAll('.input_char.highlighted');
    if(char_inputs) {
      for(let el of char_inputs) {
        el.classList.remove('highlighted');
      }
    }

    this.gamestateskip = true;
    app.wordHasNoChar = true;
  }

  async make_prediction(rules) {
    // Filter words
    const filtered_words = await this.manager.filter_words(rules);

    // Next prediction
    this.guess_char();
    this.prepare_guess();
  }

  char_clicked(event) {
    const char_index = Number(event.target.dataset.char_index)

    // Check if placeholder is already populated and populate
    if(event.target.value != '') {
      if(event.target.value == app.prediction_char) {
        event.target.value = '';
        event.target.classList.remove('highlighted');

        for(let i = this.chars_selected_indeces.length - 1; i >= 0; i--) {
          const index = this.chars_selected_indeces[i];
          if(index == char_index) {
            this.chars_selected_indeces.splice(i, 1);
            break;
          }
        }
      } else {
        // Do nothing
      }
    } else {
      event.target.value = app.prediction_char;
      this.chars_selected_indeces.push(char_index);
      event.target.classList.add('highlighted');
    }

    if(this.chars_selected_indeces.length > 0) {
      this.gamestateskip = false;
      app.wordHasNoChar = false
    } else {
      this.gamestateskip = true;
      app.wordHasNoChar = true
    }
  }

  async no_char_selected() {
    const pred_char = app.prediction_char;

    this.history_manager.append({remaining_words: this.manager.remaining_words, action: 'no_selection', character: pred_char, prediction: this.analyser.prediction});

    // Filter words
    const word_rules = {chars_not_allowed: [pred_char]};

    this.make_prediction(word_rules);
    this.wrong_chars.push(pred_char);
  }

  async all_chars_selected() {
    const pred_char = app.prediction_char;
    const indeces = this.chars_selected_indeces;

    this.guessed_indeces.push(...indeces);
    this.history_manager.append({remaining_words: this.manager.remaining_words, action: 'selected', character: pred_char, indeces, prediction: this.analyser.prediction});

    const word_rules = this.word_filter_rules(pred_char, indeces);

    this.make_prediction(word_rules);
  }

  word_filter_rules(char, arr) {
    const chars_not_at_position = {};
    const chars_at_position = {};

    for(let i = 0; i < this.manager.word_length; i++) {
      if(arr.includes(i)) {
        if(!chars_at_position[char]) {
          chars_at_position[char] = [];
        }
        chars_at_position[char].push(i);
      } else {
        if(!chars_not_at_position[char]) {
          chars_not_at_position[char] = [];
        }
        chars_not_at_position[char].push(i);
      }
    }

    return {chars_not_at_position, chars_at_position};
  }
}
