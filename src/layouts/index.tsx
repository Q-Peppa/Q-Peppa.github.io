import React, { useEffect } from 'react';
import { Outlet } from '@umijs/max';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

const Layout: React.FC<any> = () => {
  useEffect(() => {
    dayjs.locale('zh-cn');
  }, []);
  return (
    <ConfigProvider locale={zhCN}>
      <Outlet />
    </ConfigProvider>
  );
};
export default Layout;
