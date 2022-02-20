class WordManager {
  constructor() {
    this.remaining_words = [];
    this.word_list = []

    this.eliminated = 0;

    this.onLoad()
  }

  async onLoad() {
    // Preprocess word list
    // Put all words in array of same length
    let all_words_list = all_words.words
    let word_list = []
    let char_list = {}
    let current_word_length = 0

    for(let i = 0; i < all_words_list.length; i++) {
      const current_word = all_words_list[i]

      while(current_word.length > current_word_length) {
        word_list.push([])
        current_word_length++
      }

      word_list[word_list.length - 1].push(current_word)

      // Count characters
      for(let char of current_word) {
        if(char_list[char]) {
          char_list[char]++
        } else {
          char_list[char] = 1
        }
      }
    }

    char_frequencies = char_list
    this.word_list = word_list
  }

  async get_words(length = word_length) {
    if(length <= 0 || length > 33) return null

    this.word_length = length;
    let words = this.word_list[length - 1]

    return words;
  }

  async filter_words(rules, words = this.remaining_words) {
    if(!rules) {
      return new Error("Need to apply rules. ");
    }

    // if(Object.values(rules.chars_at_position).includes(rules.chars_not_allowed))

    let remaining_words = words.slice();

    if(!rules.chars_not_allowed) {
      rules.chars_not_allowed = [];
    }


    if(rules.chars_not_allowed.length > 0) {
      for(let i = remaining_words.length - 1; i >= 0; i--) {
        for(let char of remaining_words[i]) {
          if(rules.chars_not_allowed.includes(char)) {
            // Delete the word from the list
            remaining_words.splice(i, 1);
            break;
          }
        }
      }
    }


    if(rules.chars_at_position) {
      const keys = Object.keys(rules.chars_at_position);
      // Check if keys are okay to use
      for(let key of keys) {
        if(rules.chars_not_allowed.includes(key)) {
          reject(new Error("Must not forbid character (chars_not_allowed) and query same character at spicific positiion (chars_at_position). "));
        }
      }

      // Sort out words where character (key) is not at specified position (value)
      for(let i = remaining_words.length - 1; i >= 0; i--) {
        for(let key of keys) {
          for(let index of rules.chars_at_position[key]) {
            const word_char = remaining_words[i].charAt(index);

            if(word_char != key) {
              remaining_words.splice(i, 1);
              break;
            }
          }
        }
      }
    }

    // Sort out words chars_not_at_position
    if(rules.chars_not_at_position) {
      const characters = Object.keys(rules.chars_not_at_position);

      for(let i = remaining_words.length - 1; i >= 0; i--) {
        for(let char of characters) {
          for(let index of rules.chars_not_at_position[char]) {
            const word_char = remaining_words[i].charAt(index);

            if(word_char == char) {
              remaining_words.splice(i, 1);
              break;
            }
          }
        }
      }
    }

    // Get rid of doubles
    if(remaining_words.length < 20) {
      remaining_words = await this.cleanup_words(remaining_words);
    }

    const eliminated = words.length - remaining_words.length;
    this.eliminated = eliminated;

    this.remaining_words = remaining_words;
    app.remaining_words = remaining_words

    return remaining_words;
  }

  async fast_filter_words({chars_not_allowed = [], chars_at_position = {}, chars_not_at_position = {}, ...rules}, words = this.remaining_words) {
    let remaining_words = words.slice();

    loop_word: for(let i = remaining_words.length - 1; i >= 0; i--) {
      const word = remaining_words[i];

      loop_chars: for(let [char, positions] of Object.entries(chars_at_position)) {
        for(let pos of positions) {
          if(char != word.charAt(pos)) {
            remaining_words.splice(i, 1);
            break loop_chars;
          }
        }
      }

      loop_not_chars: for(let [char, positions] of Object.entries(chars_not_at_position)) {
        for(let pos of positions) {
          if(char == word.charAt(pos)) {
            remaining_words.splice(i, 1);
            break loop_not_chars;
          }
        }
      }

      for(let j in word) {
        const char = word.charAt(j);
        if(chars_not_allowed.includes(char)) {
          remaining_words.splice(i, 1);
          break;
        }
      }
    }

    const eliminated = words.length - remaining_words.length;
    this.eliminated = eliminated;
    app.remaining_words = remaining_words
    this.remaining_words = remaining_words

    return remaining_words;
  }

  async cleanup_words(words = this.remaining_words) {
    const clean_words = words.slice();

    for(let i = clean_words.length - 1; i >= 0; i--) {
      const wordA = clean_words[i];
      for(let j = i - 1; j >= 0; j--) {
        if(wordA == clean_words[j]) {
          clean_words.splice(j, 1);
          i--;
        }
      }
    }

    return clean_words;
  }
}
