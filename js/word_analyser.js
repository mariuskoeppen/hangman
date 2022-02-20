class WordAnalyser {
  constructor() {}


  async analyse_batches(words, options = {}, batch_size = 250) {
    return new Promise((resolve, reject) => {
      if(words.length <= 4 * batch_size) {
        const analysis = this.analyse_deep(words, options);
        game.analyser.analysis = analysis;
        resolve(analysis)
      } else {
        const promises = [];

        for(let i = 0; i < words.length - 1; i += batch_size) {
          const prom = this.analyse_deep(words.slice(i, i + batch_size - 1), options);
          promises.push(prom);
        }

        const combined = {chances: {}};
        const batch_counter = promises.length;

        Promise.all(promises).then(analyses => {
          // Combine analyses into one
          for(let analysis of analyses) {
            for(let character in analysis.chances) {
              if(combined.chances[character]) {
                combined.chances[character].score += analysis.chances[character].score / batch_counter;
                combined.chances[character].bias += analysis.chances[character].bias / batch_counter;
              } else {
                combined.chances[character] = {
                  score: analysis.chances[character].score / batch_counter,
                  bias: analysis.chances[character].bias / batch_counter
                }
              }
            }
          }

          game.analyser.analysis = combined;
          resolve(combined)
        })
      }
    })
  }

  async analyse_better(words) {
    if(!words) {
      return new Error('Need words for analysis. ');
    }

    const word_length = words[0].length;
    const word_count = words.length;

    const character_pattern = []

    function getCharacterPatternSet(char) {
      let pat = {
        character: char,
        pattern: []
      }

      let found = false;

      for(let charSet of character_pattern) {
        if(charSet.character == char) {
          pat = charSet
          found = true
        }
      }

      if(!found) character_pattern.push(pat)

      return pat
    }

    function matchPattern(pattern_set, word) {
      const char = pattern_set.character
      const indices = []

      for(let i = 0; i < word.length; i++) {
        if(word[i] == char) indices.push(i)
      }

      for(let existing_pattern of pattern_set.pattern) {
        let is_matching = true
        if(existing_pattern.indices.length != indices.length) continue

        for(let i = 0; i < existing_pattern.indices.length; i++) {
          if(existing_pattern.indices[i] != indices[i]) {
            is_matching = false
            break
          }
        }

        if(is_matching) {
          existing_pattern.count++
          return existing_pattern
          break;
        }
      }

      const new_pattern = {
        indices,
        count: 1
      }

      pattern_set.pattern.push(new_pattern)
    }

    for(let current_word of words) {
      let characters_in_word = current_word.split("")

      while(characters_in_word.length > 0) {
        const current_character = characters_in_word.pop()
        const char_pattern_set = getCharacterPatternSet(current_character)
        matchPattern(char_pattern_set, current_word)

        // Remove same characters
        characters_in_word = characters_in_word.filter(c => c != current_character)
      }
    }

    // Add 'empty' pattern []
    for(let char_pattern_set of character_pattern) {
      const matches = char_pattern_set.pattern.reduce((t, c) => t + c.count , 0)
      char_pattern_set.frequency = matches / word_count
      char_pattern_set.pattern.push({
        indices: [],
        count: word_count - matches
      })
    }

    let information_gain = []

    for(let character_pattern_set of character_pattern) {
      let sum = 0

      for(let pattern of character_pattern_set.pattern) {
        const probability = pattern.count / word_count
        const information = - Math.log2(probability)
        sum += probability * information
      }

      information_gain.push({
        character: character_pattern_set.character,
        information: sum,
        frequency: character_pattern_set.frequency
      })
    }

    // (For now) Sort out NaN information gain caused by Infinity * 0
    // for characters which are in every word (100% probability)
    information_gain = information_gain.filter(c => !isNaN(c.information))

    information_gain.sort((a, b) => {
      if(b.information == a.information) {
        char_frequencies[b] - char_frequencies[a]
      }

      return b.information - a.information
    })

    const prediction = {
      character: information_gain[0].character,
      score: information_gain[0].information
    };

    console.log(words, information_gain);

    app.analysis = information_gain

    this.prediction = prediction;
    app.prediction_char = prediction.character;

    return prediction
  }

  // Currently used
  async predict_smart(analysis) {

    if(!analysis) {
      return new Error('Need analysis for prediction. ');
    }


    let best_char = null;
    let highest_score = -Infinity;

    for(let character in analysis.chances) {
      const evaluation = analysis.chances[character];
      if(game.guessed_chars.includes(character)) continue;
      if(evaluation.score == Infinity) continue;

      const score = evaluation.score + evaluation.bias / 5;

      if(score > highest_score) {
        highest_score = score;
        best_char = character;
      }
    }

    const prediction = {
      character: best_char,
      score: highest_score,
      bias: analysis.chances[best_char].bias,
    };

    this.prediction = prediction;
    app.prediction_char = prediction.character;

    return prediction;
  }

  async analyse_fast(words) {
    if(!words) {
      return new Error('Need words for analysis. ');
    }

    const word_length = words[0].length;
    const word_count = words.length;

    // Create a map of all possible characters
    const character_word_count = new Map();
    const character_index_count = new Map();

    // Loop through all words and characters
    for(let word of words) {
      const memory = {};
      for(let index = 0; index < word.length; index++) {
        const character = word.charAt(index);

        // Character word count
        if(character_word_count.has(character)) {
          if(memory[character]) continue;
          character_word_count.set(character, character_word_count.get(character) + 1);
          memory[character] = true;
        } else {
          character_word_count.set(character, 1);
          memory[character] = true;
        }

        // Character index count
        if(character_index_count.has(character)) {
          const counts = character_index_count.get(character);
          if(counts[index]) {
            counts[index]++;
          } else {
            counts[index] = 1;
          }
        } else {
          character_index_count.set(character, new Array(word_length).fill(0));
          character_index_count.get(character)[index] = 1;
        }
      }
    }

    const character_map = new Map();
    for(let [key, value] of character_word_count) {
      character_map.set(key, {
        word_count: value,
        probability: value / word_count,
      });
    }

    const information_gain = new Map();
    for(let [char, index_counts] of character_index_count) {
      let sum = 0;
      for(let count of index_counts) {
        if(count === 0) {
          continue
        } else if(count === word_count) {
          sum = Infinity;
          break;
        }

        const prob = count / word_count;
        const left = word_count - count;
        const gain = -Math.log(left / word_count);

        sum += prob * gain;
      }
      const gain_on_lose = (1 - character_map.get(char).probability) * character_map.get(char).probability;
      // const gain_on_lose = ((1 - character_map.get(char).probability) * -Math.log(character_map.get(char).word_count / word_count)) / character_map.get(char).probability

      let ratio = sum / (1.1 - character_map.get(char).probability) + gain_on_lose;

      information_gain.set(char, {ratio, sum, gain_on_lose})
    }


    const analysis = {character_map, information_gain};

    // Return
    this.analysis = analysis;
    return analysis;
  }

  // Currently used
  async analyse_deep(words, options, prune = true) {
    if(!words || words.length == 0) {
      return new Error('Need words for analysis. ');
    } else {
      const word_count = words.length;
      const word_length = words[0].length;

      const pattern_map = {};
      for(let word of words) {
        // Loop through every character
        const word_memory = {};
        for(let i = 0; i < word.length; i++) {
          // Loop through every other character to find same character
          const character = word.charAt(i);
          if(options.ignore_characters.includes(character)) continue;

          if(word_memory[character]) {
            word_memory[character].push(i);
          } else {
            word_memory[character] = [i];
          }
        }

        for(let character in word_memory) {
          const positions = word_memory[character];

          if(pattern_map[character]) {
            let pattern_found = false;
            for(let i = 0; i < pattern_map[character].length; i++) {
              if(positions.length == pattern_map[character][i].pattern.length) {
                let pattern_same = true;
                for(let j = 0; j < pattern_map[character][i].pattern.length; j++) {
                  if(pattern_map[character][i].pattern[j] != positions[j]) {
                    pattern_same = false;
                    break;
                  }
                }

                if(pattern_same) {
                  pattern_found = true;
                  pattern_map[character][i].count++;
                  break;
                }
              }
            }

            if(!pattern_found) {
              pattern_map[character].push({pattern: positions, count: 1});
            }
          } else {
            pattern_map[character] = [{pattern: positions, count: 1}];
          }
        }
      }


      const chances = {};
      for(let character in pattern_map) {
        const pairings = pattern_map[character];

        let sum = 0;
        for(let pairing of pairings) {
          const probability = pairing.count / word_count;
          sum += probability * -Math.log(probability);
        }

        const character_word_count = pairings.reduce((acc, curr) => acc + curr.count, 0);
        const prob = (character_word_count / word_count);
        const bias = (1 - prob) * prob;
        const score = sum / (1.1 - prob);
        chances[character] = {score, count: character_word_count, bias};
      }

      const analysis = {chances};
      // this.analysis = analysis;

      return analysis;
    }
  }
}
