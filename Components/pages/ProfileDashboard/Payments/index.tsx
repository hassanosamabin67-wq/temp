'use client'
import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, Empty } from 'antd';
import { useAppSelector } from '@/store';
import { handleDownloadInvoicePdf } from '@/utils/add-invoices/handleDownloadInvoice';
import { PaymentMethods } from './PaymentMethods';
import { TransactionsTable } from './TransactionsTable';
import { InvoicesTable } from './InvoicesTable';
import { usePaymentMethods } from '@/hooks/profileDashboard/usePaymentMethod';
import { useInvoices } from '@/hooks/profileDashboard/useInvoices';
import { useTransactions } from '@/hooks/profileDashboard/useTransaction';

const Payments = () => {
    const [activeTab, setActiveTab] = useState('invoices');
    const profileRedux = useAppSelector((state) => state.auth);

    const { methods, loading: methodsLoading, loadMethods, setDefaultMethod, removeMethod } = usePaymentMethods();
    const { transactions, loading: transactionsLoading, fetchTransactions, downloadTransactionPdf } = useTransactions();
    const { invoices, loading: invoicesLoading, fetchInvoices } = useInvoices();

    useEffect(() => {
        if (profileRedux.profileId) {
            loadMethods(profileRedux.profileId);
            fetchTransactions(profileRedux.profileId);
            fetchInvoices(profileRedux.profileId);
        }
    }, [profileRedux.profileId, loadMethods, fetchTransactions, fetchInvoices]);

    const tabItems = useMemo(() => ([
        {
            key: 'invoices',
            label: (
                <span style={{ fontWeight: 500, fontSize: 14, padding: '4px 8px' }}>
                    Invoices ({invoices?.length || 0})
                </span>
            )
        },
        {
            key: 'transactions',
            label: (
                <span style={{ fontWeight: 500, fontSize: 14, padding: '4px 8px' }}>
                    Transactions ({transactions.length})
                </span>
            )
        },
        // {
        //     key: 'methods',
        //     label: (
        //         <span style={{ fontWeight: 500, fontSize: 14, padding: '4px 8px' }}>
        //             Payment Methods ({methods?.length || 0})
        //         </span>
        //     )
        // },
    ]), [invoices?.length, methods.length, transactions.length]);

    const handleSetDefault = async (paymentMethodId: string) => {
        if (profileRedux.profileId) {
            await setDefaultMethod(profileRedux.profileId, paymentMethodId);
        }
    };

    const handleRemove = async (paymentMethodId: string) => {
        if (profileRedux.profileId) {
            await removeMethod(profileRedux.profileId, paymentMethodId);
        }
    };

    const handleMethodAdded = () => {
        if (profileRedux.profileId) {
            loadMethods(profileRedux.profileId);
        }
    };

    const getCurrentLoading = () => {
        if (activeTab === 'transactions') return transactionsLoading;
        if (activeTab === 'invoices') return invoicesLoading;
        if (activeTab === 'methods') return methodsLoading;
        return false;
    };

    const getCurrentDataCount = () => {
        if (activeTab === 'transactions') return transactions.length;
        if (activeTab === 'invoices') return invoices.length;
        if (activeTab === 'methods') return methods.length;
        return 0;
    };

    const renderEmptyState = (type: string) => (
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
                <span style={{
                    fontSize: '16px',
                    color: '#8c8c8c',
                    fontWeight: 500
                }}>
                    No {type} found
                </span>
            }
            style={{ padding: '60px 20px' }}
        />
    );

    const renderTabContent = () => {
        switch (activeTab) {
            // case 'methods':
            //     return (
            //         <PaymentMethods
            //             methods={methods}
            //             loading={methodsLoading}
            //             userId={profileRedux.profileId!}
            //             userInfo={{
            //                 firstName: profileRedux.firstName,
            //                 lastName: profileRedux.lastName,
            //                 email: profileRedux.email,
            //             }}
            //             onSetDefault={handleSetDefault}
            //             onRemove={handleRemove}
            //             onAdded={handleMethodAdded}
            //         />
            //     );

            case 'transactions':
                return getCurrentDataCount() === 0 && !getCurrentLoading() ? (
                    renderEmptyState('transactions')
                ) : (
                    <TransactionsTable
                        transactions={transactions}
                        loading={transactionsLoading}
                        onDownloadPdf={downloadTransactionPdf}
                    />
                );

            case 'invoices':
                return getCurrentDataCount() === 0 && !getCurrentLoading() ? (
                    renderEmptyState('invoices')
                ) : (
                    <InvoicesTable
                        invoices={invoices}
                        loading={invoicesLoading}
                        onDownloadPdf={handleDownloadInvoicePdf}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '24px 24px 0 24px',
                borderBottom: '1px solid #f0f0f0'
            }}>
                <h2 style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#262626',
                    marginBottom: '16px'
                }}>
                    Payments
                </h2>

                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key)}
                    items={tabItems}
                    size="large"
                    style={{ marginBottom: 0 }}
                    destroyInactiveTabPane={false}
                />
            </div>

            <div style={{ padding: activeTab === 'methods' ? '0' : '0' }}>
                {renderTabContent()}
            </div>
        </div>
    );
};

export default Payments;