// PricingType.tsx
import React from 'react';
import styles from './style.module.css';
import { Button, Tabs, TabsProps } from 'antd';
import PricingDetail from './PricingDetail';

const PricingType = ({ bookingCounts, serviceId, serviceProviderId, serviceTitle, availability, pricingPackage, currency = 'PKR' }: any) => {

    const items: TabsProps['items'] = (pricingPackage ?? []).map((pkg: any, idx: number) => ({
        key: pkg.key || String(idx),
        label: <span className={styles.tabLabel}>{pkg.label || pkg.key}</span>,
        children: <PricingDetail pkg={pkg} currency={currency} availability={availability} serviceId={serviceId} serviceProviderId={serviceProviderId} serviceTitle={serviceTitle} />,
    }));

    return (
        <div className={styles.tabDiv}>
            <Tabs
                items={items}
                indicator={{ size: (origin) => origin - 0, align: 'center' }}
                centered
                className={styles.pricingTab}
            />

            {bookingCounts && (
                <div className={styles.containerDiv}>
                    <span className={styles.bookedBtn}>{bookingCounts} people booked this service</span>
                </div>
            )}
        </div>
    );
};

export default PricingType;