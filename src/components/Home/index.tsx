import styles from './index.less';
import { Button, Drawer } from 'antd';
import { useBoolean } from 'ahooks';
const Home = () => {
  const [open, { toggle }] = useBoolean(false);

  return (
    <div>
      <h1 className={styles.title}>测试小网页</h1>
      <Button onClick={toggle} type="primary">
        click me
      </Button>
      <Drawer open={open} onClose={toggle} title="Basic Drawer" width={'20%'}>
        <div>
          <p>好好看你的书！！！</p>
          <span>尝试用gulp自动化开发， 如果你能看到这段话，说明你已经成功</span>
        </div>
      </Drawer>
    </div>
  );
};
export default Home;
