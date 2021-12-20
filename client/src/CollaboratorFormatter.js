// A map of collaborator -> color, populated dynamically
// as collaborators join the session
const COLOR_MAP = {

}

// Map of annotations currently locked by
// other collaborators
const CURRENT_LOCKS = {

}

export const addLock = (annotation, lockedBy) => {
  const count = Object.keys(window.currentLocks).length;
  const color = palette[count % palette.length];
  window.currentLocks[annotationId] = { lockedBy, color };
}

export default annotation => {
  // Check if this annotation is locked by someone
  const locked = CURRENT_LOCKS[annotation.id];

  if (locked) {
    const { lockedBy, color } = locked;

    // Label
    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    foreignObject.setAttribute('width', '1px');
    foreignObject.setAttribute('height', '1px');

    foreignObject.innerHTML = `
      <div xmlns="http://www.w3.org/1999/xhtml" class="a9s-shape-label-wrapper">
        <div class="a9s-shape-label" style="background-color:${color}">
          ${lockedBy}
        </div>
      </div>`;

    return {
      className: 'locked',
      element: foreignObject,
      'data-locked': lockedBy,
      style: `stroke: ${color}`
    }
  }

}