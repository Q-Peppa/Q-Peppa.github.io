import React, { useEffect } from 'react';
import { Outlet } from '@umijs/max';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

export default () => {
  useEffect(() => {
    dayjs.locale('zh-cn');
  }, []);
  return (
    <React.Fragment>
      <ConfigProvider locale={zhCN}>
        <Outlet />
      </ConfigProvider>
    </React.Fragment>
  );
};
