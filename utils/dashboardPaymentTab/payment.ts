export const currency = (cents: number = 0, code = "USD") =>
    `${(cents / 100).toFixed(2)} ${code}`;

export const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
        'Paid': 'green',
        'Unpaid': 'orange',
        'Overdue': 'red',
        'completed': 'green',
        'pending': 'orange',
        'failed': 'red',
        'refunded': 'blue',
        'canceled': 'gray',
        'Payment': 'green',
        'Hold': 'orange',
        'Refund': 'blue',
    };
    return colors[status] || 'default';
};

export const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
        'payment': 'green',
        'refund': 'blue',
        'fee': 'orange',
        'withdrawal': 'red',
        'deposit': 'green',
    };
    return colors[type] || 'default';
};