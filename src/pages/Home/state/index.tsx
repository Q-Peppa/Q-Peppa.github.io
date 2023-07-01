import { proxy } from 'valtio';
import { derive } from 'valtio/utils';

const initialState = {
  age: 0,
  name: 'max',
};

const HomeState = proxy(initialState);
const someDeriveState = derive({
  isPerson: (h) => h(HomeState).age > 3,
});
export default HomeState;

export { someDeriveState };
