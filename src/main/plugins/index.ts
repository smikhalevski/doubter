import enhanceArrayShape from 'doubter/plugins/array';
import enhanceNumberShape from 'doubter/plugins/number';
import enhanceSetShape from 'doubter/plugins/set';
import enhanceStringShape from 'doubter/plugins/string';

export default function () {
  enhanceArrayShape();
  enhanceNumberShape();
  enhanceSetShape();
  enhanceStringShape();
}
