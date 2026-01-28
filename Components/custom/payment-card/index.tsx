import { CardElement } from '@stripe/react-stripe-js'
import { Card } from 'antd'

const PaymentCard = () => {
    return (
        <Card>
            <CardElement
                options={{
                    hidePostalCode: true,
                    style: {
                        base: {
                            fontSize: "16px",
                            color: "#32325d",
                            "::placeholder": { color: "#a0aec0" },
                        },
                        invalid: { color: "#fa755a" },
                    },
                }}
            />
        </Card>
    )
}

export default PaymentCard