import { useSetState } from 'ahooks';

export default function User() {
  const [user, setUser] = useSetState({
    name: 'ahooks',
    age: 10,
    address: 'China',
  });
  return {
    user,
    setUser,
  };
}
