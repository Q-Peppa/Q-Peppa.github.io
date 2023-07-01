import React from 'react';
import { useProxy } from 'valtio/utils';
import HomeState from '@/pages/Home/state';
import { Card, Typography } from 'antd';
const Home: React.FC = () => {
  const HomeConsumer = useProxy(HomeState);

  return (
    <React.Fragment>
      <div>
        <Card title={HomeConsumer.name}>
          <Typography.Title>{HomeConsumer.age > 3}</Typography.Title>
        </Card>
      </div>
    </React.Fragment>
  );
};

export default Home;
