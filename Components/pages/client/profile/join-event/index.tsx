import { Menu } from 'antd';
import { AppstoreOutlined, CalendarOutlined, BulbOutlined, StarOutlined } from '@ant-design/icons';

const NavigationBar = () => {
  return (
    <Menu mode="horizontal" disabledOverflow>
      <Menu.Item key="collabRoom" icon={<AppstoreOutlined />}>
        Collab Room
      </Menu.Item>
      <Menu.Item key="joinEvent" icon={<CalendarOutlined />}>
        Join Event
      </Menu.Item>
      <Menu.Item key="thinkTank" icon={<BulbOutlined />}>
        Think Tank
      </Menu.Item>
      <Menu.Item key="savedVisionaries" icon={<StarOutlined />}>
        Saved Visionaries
      </Menu.Item>
    </Menu>
  );
};

export default NavigationBar;
