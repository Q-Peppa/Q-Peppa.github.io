import React, { useEffect, useState } from 'react';
import { Outlet } from 'umi';
import { ConfigProvider } from 'antd';
import type { Locale } from 'antd/es/locale';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
export default () => {
  const [locale, setLocal] = useState<Locale>(zhCN);
  useEffect(() => {
    dayjs.locale('zh-cn');
  }, []);
  return (
    <React.Fragment>
      <ConfigProvider locale={locale}>
        <Outlet />
      </ConfigProvider>
    </React.Fragment>
  );
};
