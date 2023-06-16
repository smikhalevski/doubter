import enhanceArrayShape from 'doubter/validators/arrays';
import enhanceNumberShape from 'doubter/validators/numbers';
import enhanceSetShape from 'doubter/validators/sets';
import enhanceStringShape from 'doubter/validators/strings';

export default function () {
  enhanceArrayShape();
  enhanceNumberShape();
  enhanceSetShape();
  enhanceStringShape();
}
