import styles from './index.less';
import { Button, Drawer } from 'antd';
import { useBoolean } from 'ahooks';
// @refresh reset
const Home = () => {
  const [open, { toggle }] = useBoolean(false);

  return (
    <div>
      <h1 className={styles.title}>Page index123</h1>
      <Button onClick={toggle} type="primary">
        Button
      </Button>
      <Drawer open={open} onClose={toggle} title="Basic Drawer" width={600}>
        <div>
          <p>this is drawer</p>
        </div>
      </Drawer>
    </div>
  );
};
export default Home;
