import React from 'react';
import { DatePicker } from 'antd';
import { useModel } from '@umijs/max';

const Home: React.FC = () => {
  const { user, setUser } = useModel('user');
  return (
    <React.Fragment>
      <DatePicker />
      <p>{user.age}</p>
      <button
        onClick={() => {
          setUser({
            age: user.age + Number((Math.random() * 10).toFixed(0)),
          });
        }}
      >
        add age
      </button>
    </React.Fragment>
  );
};

export default Home;
