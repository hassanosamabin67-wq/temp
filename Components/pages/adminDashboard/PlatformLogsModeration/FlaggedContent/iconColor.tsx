import React from 'react';
import { FiUser, FiMessageSquare, FiHome } from 'react-icons/fi';

export const getPriorityColor = (priority: any) => {
    switch (priority) {
        case 'high': return 'red';
        case 'medium': return 'gold';
        case 'low': return 'green';
        default: return 'default';
    }
};

export const getContentTypeIcon = (type: any) => {
    switch (type) {
        case 'message': return <FiMessageSquare />;
        case 'profile': return <FiUser />;
        case 'room': return <FiHome />;
        default: return <FiMessageSquare />;
    }
};

export const getSeverityColor = (severity: string) => {
    switch (severity) {
        case 'critical': return 'red';
        case 'high': return 'orange';
        case 'warning': return 'gold';
        case 'success': return 'green';
        default: return 'default';
    }
};

export const getActionTypeColor = (type: string) => {
    switch (type) {
        case 'content': return 'gold';
        case 'contract': return 'gold';
        case 'room': return 'lime';
        case 'user': return 'magenta';
        case 'auth': return "geekblue";
        case 'system': return "purple";
        case 'applcation': return "cyan";
        case 'profile_note': return "red";
        default: return 'default';
    }
}