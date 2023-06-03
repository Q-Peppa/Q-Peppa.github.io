import React from 'react';
import { Button, DatePicker, message } from 'antd';
import { useModel } from '@umijs/max';
let t = 0;
const Home: React.FC = () => {
  const { user, setUser } = useModel('user');
  const handleClick = () => {
    console.log(t);
    message.info(`hello, ${t}`);
    setUser({
      age: user.age + t,
    });
  };
  return (
    <React.Fragment>
      <DatePicker
        onSelect={(e) => {
          t = e.get('D');
        }}
      />
      <p>{user.age}</p>
      <Button onClick={handleClick}>add age</Button>
    </React.Fragment>
  );
};

export default Home;
