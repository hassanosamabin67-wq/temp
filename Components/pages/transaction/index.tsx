import React from 'react'
import "./style.css"
import TransactionsComponent from './TransactionsComponent'

const Transactions = () => {

    return (
        <div className='transaction-main'>
            <h1>Transactions</h1>
            <div className='transaction-container'>
                <div className='transaction-div'>
                    <div className='transaction-header'>
                        <span>Transaction for</span>
                        <span>Date</span>
                        <span>Amount</span>
                    </div>
                    <TransactionsComponent limit={false} />
                </div>
            </div>
        </div>
    )
}

export default Transactions