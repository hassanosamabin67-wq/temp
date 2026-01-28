import { Checkbox } from 'antd';

const PaymentMethods = () => {
  const paymentData = [
    { id: 1, name: 'Credit Card', active: true },
    { id: 2, name: 'PayPal', active: true },
    { id: 3, name: 'Bitcoin', active: true }
  ]

  return (
    <div className='container'>
      <span className='heading'>Active Payment Methods</span>
      <div className='payment-div'>
        {paymentData.map((data) => (
          <div key={data.id}>
            <Checkbox style={{ fontSize: 18 }} checked={data.active}>{data.name}</Checkbox>
            {data.active && (<span style={{ color: "#3cb102eb", fontSize: 12 }}>-Active</span>)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethods;
