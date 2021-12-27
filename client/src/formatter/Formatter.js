import { getColor } from './Colors';

/**
 * Map of annotations currently locked by
 * other collaborators
 */
const CURRENT_LOCKS = {}

/**
 * Helper to track current locks and collaborator colors.
 */
export const lockAnnotation = (annotationId, lockedBy) => {
  const color = getColor(lockedBy);
  CURRENT_LOCKS[annotationId] = { lockedBy, color };
}

export const releaseLock = annotationId =>
  delete CURRENT_LOCKS[annotationId];

export const releaseLocksBy = userId => {
  const updated = Object.keys(CURRENT_LOCKS).find(annotationId =>
    CURRENT_LOCKS[annotationId].lockedBy === userId);

  if (updated)
    delete CURRENT_LOCKS[updated];
    
  return updated;
}

export default annotation => {
  // Check if this annotation is locked by someone
  const locked = CURRENT_LOCKS[annotation.id];

  if (locked) {
    const { lockedBy, color } = locked;

    // Label
    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    foreignObject.setAttribute('class', 'a9s-rt');
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