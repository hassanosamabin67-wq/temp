import { useEffect, useState } from 'react';
import { List, Card, Tag } from 'antd';

const JobPostings = () => {
  const [jobs, setJobs] = useState<any>([]);

  useEffect(() => {
    // Simulate fetching data
    setJobs([
      { id: "1", title: 'Software Developer', status: 'Active' },
      { id: "2", title: 'Graphic Designer', status: 'Completed' },
      { id: "3", title: 'Project Manager', status: 'Active' },
      { id: "4", title: 'Project Manager', status: 'Active' }
    ]);
  }, []);

  return (
    <div className='container'>
      <span className='heading'>Job Postings</span>
      {/* <List
        grid={{ gutter: 15, column: 2 }}
        dataSource={jobs}
        renderItem={(item: any) => (
          <List.Item> */}
      <div className="cards-container">
        {jobs.map((item: any) => (
          <Card key={item.key}>
            <h3>{item.title}</h3>
            <Tag color={item.status === 'Active' ? 'green' : 'volcano'}>{item.status}</Tag>
          </Card>
        ))}
      </div>
      {/* </List.Item> */}
      {/* )} */}
      {/* /> */}
    </div>
  );
};

export default JobPostings;
