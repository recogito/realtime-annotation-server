// A map of collaborator -> color, populated dynamically
// as collaborators join the session
const COLOR_MAP = {}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
const shuffle = array => {
  let currentIndex = array.length;
  let randomIndex;

  while (currentIndex != 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] =
      [array[randomIndex], array[currentIndex]];
  }

  return array;
}

const PALETTE = shuffle([
  'blue', 
  'blueviolet',
  'brown',
  'darkblue',
  'darkgoldenrod',
  'darkgreen', 
  'darkorange',
  'darkred',
  'darkslateblue',
  'darkslategrey',
  'fuchsia',
  'indigo',
  'maroon',
  'saddlebrown', 
  'steelblue'
]);

export const getColor = collaborator => {
  if (!COLOR_MAP[collaborator]) {
    // Add a new collaborator to the color map
    const idx = Object.keys(COLOR_MAP).length;

    // Get next color in the list
    const color = PALETTE[length % PALETTE.length];
    COLOR_MAP[collaborator] = color;
  }

  return COLOR_MAP[collaborator];
}