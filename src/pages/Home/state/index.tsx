import { appName } from '@/constant';
import { proxy } from 'valtio';

const initialState = {
  age: 0,
  name: appName,
};

const HomeState = proxy(initialState);

export default HomeState;
