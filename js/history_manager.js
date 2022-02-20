class HistoryManager {
  history = [];

  constructor() {}

  append(step) {
    this.history.push(step);
  }

  step_back() {
    const last_step = this.history.pop();

    game.guessed_chars.splice(game.guessed_chars.length - 2, 2)
    game.timesguessed -= 1;

    game.manager.remaining_words = last_step.remaining_words;

    game.analyser.prediction = last_step.prediction;

    app.prediction_char = last_step.character


    if(last_step.action == 'selected') {
      const input_elements = document.querySelectorAll('.input_char')

      for(let index of last_step.indeces) {
        input_elements[index].value = '';
      }

      const highlighted_inputs = document.querySelectorAll('.input_char.highlighted');
      for(let el of highlighted_inputs) {
        el.classList.remove('highlighted')
        el.value = '';
      }
    } else if(last_step.action == 'no_selection') {
      game.wrong_chars.pop()
    }
  }

  clear() {
    this.history = [];
  }

}
