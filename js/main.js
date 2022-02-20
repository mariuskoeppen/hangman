let game, app, router, dom;
let word_length = 5;
let char_frequencies = {}

// const unwanted_characters = ["-", "'", ".", ",", "/", " ", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const unwanted_characters = ["-", "'", ",", " ", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'é', 'ò', 'ƒ', '‚', '“', '('];


async function setup() {
  game = new Game();

  init_vue();
  init_router();

  add_word_length(0);
}


function add_word_length(val) {
  if(word_length + val < 3 || word_length + val > 30) {
    return;
  }

  word_length += val;
  dom.send_value('#output_word_length', word_length);
  app.add_length(val)
}


async function get_regex({chars_not_allowed = [], chars_at_position = {}, chars_not_at_position = {}}) {
  let exp = '([';
  for(let char of chars_not_allowed) {
    exp += char;
  }

  exp += ']';

  for(let [char, positions] of Object.entries(chars_at_position)) {
    for(let pos of positions) {
      if(pos == 0) {
        exp += `|(?:^[^${char}])`;
      } else {
        exp += `|(?:^.{${pos - 1}}[^${char}])`;
      }
    }
  }

  for(let [char, positions] of Object.entries(chars_not_at_position)) {
    for(let pos of positions) {
      if(pos == 0) {
        exp += `|(?:^[${char}])`;
      } else {
        exp += `|(?:^.{${pos - 1}}[${char}])`;
      }
    }
  }

  exp += ')';

  return new RegExp(exp, 'gi');
}


const call_after_dom_update = (cb) => {
  const intermediate = () => window.requestAnimationFrame(cb);
  window.requestAnimationFrame(intermediate);
}



window.onkeydown = function(event) {
  if(dom.is_visible('#start') && !dom.is_visible('#play')) {
    const keycode = event.keyCode;
    if(keycode === 38 || keycode === 39) {
      add_word_length(1);
      return;
    } else if(keycode === 40 || keycode === 37) {
      add_word_length(-1);
      return;
    }
  }
}

window.onload = function() {
  setup();
}
