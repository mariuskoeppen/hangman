const time_format = function(millisecs, accuracy = 'second', max_units = 2, abbrv = false, names = true, concatinator = ' ') {
  const units = ['year', 'day', 'hour', 'minute', 'second', 'millisecond'];
  const units_abbr = ['yr', 'd', 'h', 'min', 's', 'ms'];
  const unit_duration = [365, 24, 60, 60, 1000];
  let resp = [];
  const acc_ind = (units.includes(accuracy)) ?  units.indexOf(accuracy) : (units_abbr.includes(accuracy) ?  units_abbr.indexOf(accuracy) : units.length-1 );
  const unit_names = abbrv ? units_abbr : units;

  let rest = millisecs;

  let units_available = max_units;

  // Failsafe
  if(millisecs < 0 || ![...units, ...units_abbr, null, undefined].includes(accuracy) || max_units < 1) return console.warn('Check your arguments, something doesnt match up');

  for (let i = 0; i < units.length; i++) {
    if(i > acc_ind || units_available < 1  || rest <= 0) break;

    // Find units total duration in millisecs
    const dur_mult = unit_duration.reduce((acc, d, ind) => {
      if(ind >= i) return acc*d;
      else return 1;
    }, 1);

    if (dur_mult <= rest) {
      const unit_fits = Math.floor(rest/dur_mult);
      rest -= dur_mult*unit_fits;
      units_available--;

      resp = [...resp, {index: i, unit_fits}];
    } else continue;
  }

  let text = [];
  for(let r of resp) {
    text = [...text, `${r.unit_fits}${abbrv ? '' : ' '}${names ? unit_names[r.index] : ''}${!abbrv ? (r.unit_fits > 1 ? 's' : '') : ''}`];
  }

  if(text.length < 1) {
    return `less than a ${accuracy}`;
  }
  return text.join(concatinator);
}
