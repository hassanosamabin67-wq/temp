import React from 'react'
import Link from 'next/link';
import './style.css'
import TransactionsComponent from '@/Components/pages/transaction/TransactionsComponent';

const RecentTransactions = () => {
    return (
        <div className='container'>
            <span className="heading">Recent Transactions</span>
            <TransactionsComponent limit={true} />
            <div style={{ marginTop: 20 }}>
                <Link href={'/transactions'} className='view-more-transactions'>View All</Link>
            </div>
        </div>
    )
}

export default RecentTransactions