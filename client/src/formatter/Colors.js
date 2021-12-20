/**
 * A map of collaborator -> color, populated dynamically
 * as collaborators join the session
 */
const COLOR_MAP = {}

/**
 * Helper to suffle the list, so colors don't look the same every time.
 * 
 * https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */
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

/**
 * Color palette
 */
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

/**
 * Gets a color for a given collaborator. If the collaborator is
 * already in the map, that color is returned (so that the color
 * remains consistent). If the collaborator is not yet in the
 * list, the next color from the palette is returned, and the 
 * collaborator stored in the list.
 */
export const getColor = collaborator => {
  if (!COLOR_MAP[collaborator]) {
    // Add a new collaborator to the color map
    const idx = Object.keys(COLOR_MAP).length % PALETTE.length;

    // Get next color in the list
    COLOR_MAP[collaborator] = PALETTE[idx];
  }

  return COLOR_MAP[collaborator];
}