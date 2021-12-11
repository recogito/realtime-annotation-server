import CONFIG from './config';

export const createAnnotation = annotation =>
  r.connect(CONFIG)
    .then(conn => 
        r.table('annotation')
          .insert(annotation)
          .run(conn));

export const deleteById = annotationId =>
  r.connect(CONFIG)
    .then(conn => 
        r.table('annotation')
          .get(annotationId)
          .delete()
          .run(conn));