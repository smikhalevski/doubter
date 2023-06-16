import arraysPlugin from 'doubter/plugins/arrays';
import numbersPlugin from 'doubter/plugins/numbers';
import setsPlugin from 'doubter/plugins/sets';
import stringsPlugin from 'doubter/plugins/strings';

export default function () {
  arraysPlugin();
  numbersPlugin();
  setsPlugin();
  stringsPlugin();
}
