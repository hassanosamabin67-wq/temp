import React, { useState, useEffect } from 'react'
import { supabase } from '@/config/supabase'
import { useAppSelector } from '@/store';

interface Milestone {
    id: string;
    orderId: string;
    title: string;
    amount?: number;
    status: 'PENDING' | 'IN PROGRESS' | 'COMPLETED';
    deadline: string;
    createdAt?: string;
}

interface Project {
    id: string;
    title: string;
    status: 'ACTIVE' | 'PENDING' | 'IN REVIEW';
    clientName: string;
    startDate: string;
    deadline: string;
    description?: string;
    completedAt?: string;
    priceType?: string;
}

interface ProjectCounts {
    active: number;
    pending: number;
    completed: number;
}

export default function useVisionaryProjects() {
    const profile = useAppSelector((state) => state.auth);
    const [projects, setProjects] = useState<Project[]>([]);
    const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(false);
    const [projectCounts, setProjectCounts] = useState<ProjectCounts>({
        active: 0,
        pending: 0,
        completed: 0
    });

    const mapStatus = (status: string): 'ACTIVE' | 'PENDING' | 'IN REVIEW' | null => {
        switch (status.toLowerCase()) {
            case 'accepted':
                return 'ACTIVE';
            case 'submitted':
                return 'IN REVIEW';
            case 'pending':
                return 'PENDING';
            case 'approved':
                return null;
            default:
                return 'PENDING';
        }
    };

    const mapMilestoneStatus = (status: string): 'PENDING' | 'IN PROGRESS' | 'COMPLETED' => {
        switch (status.toLowerCase()) {
            case 'submitted':
                return 'IN PROGRESS';
            case 'pending':
                return 'PENDING';
            case 'approved':
                return 'COMPLETED';
            default:
                return 'PENDING';
        }
    };

    const handleFetchActiveProjects = async () => {
        if (!profile.profileId) return;

        try {
            setLoading(true);
            const { data: serviceOrderData, error: serviceError } = await supabase
                .from('service_orders')
                .select(`id, service_name, package_name, deadline, created_at, status, client_id, updated_at, details_text,
                    users!service_orders_client_id_fkey(userId, firstName, lastName)`)
                .eq('visionary_id', profile.profileId);

            if (serviceError) {
                console.error("Error fetching service orders:", serviceError);
                return;
            }

            const { data: orderData, error: orderError } = await supabase
                .from('order')
                .select(`id, title, start_datetime, end_datetime, created_at, status, client_id, updated_at, milestone, description, price_type,
                    users!order_client_id_fkey(userId, firstName, lastName)`)
                .eq('visionary_id', profile.profileId);

            if (orderError) {
                console.error("Error fetching orders:", orderError);
                return;
            }

            const processedServiceOrders = (serviceOrderData || []).map((order: any) => {
                const clientName = order.users ? `${order.users.firstName || ''} ${order.users.lastName || ''}`.trim() : 'Unknown Client';

                return {
                    id: `service_${order.id}`,
                    title: order.service_name || 'Untitled Service',
                    description: order.details_text,
                    status: order.status.toLowerCase(),
                    clientName,
                    startDate: order.created_at,
                    deadline: order.deadline,
                    completedAt: order.status.toLowerCase() === 'approved' ? order.updated_at : null
                };
            });

            const processedOrders = (orderData || []).map((order: any) => {
                const clientName = order.users ? `${order.users.firstName || ''} ${order.users.lastName || ''}`.trim() : 'Unknown Client';

                const lastMilestoneDeadline = (order.milestone && order.milestone.length > 0) ?
                    order.milestone[order.milestone.length - 1].due_date : null;

                return {
                    id: `order_${order.id}`,
                    title: order.title || 'Untitled Project',
                    description: order.description,
                    status: order.status.toLowerCase(),
                    clientName,
                    startDate: order.start_datetime || order.created_at,
                    deadline: lastMilestoneDeadline || order.end_datetime,
                    completedAt: order.status.toLowerCase() === 'approved' ? order.updated_at : null,
                    priceType: order.price_type
                };
            });

            const allProcessedProjects = [...processedServiceOrders, ...processedOrders];

            const activeProjects: Project[] = [];
            const completedProjects: Project[] = [];

            allProcessedProjects.forEach((project: any) => {
                if (project.status === 'approved') {
                    completedProjects.push({
                        ...project,
                        status: 'COMPLETED'
                    });
                } else {
                    const mappedStatus = mapStatus(project.status);
                    if (mappedStatus) {
                        activeProjects.push({
                            ...project,
                            status: mappedStatus
                        });
                    }
                }
            });

            setProjects(activeProjects);
            setCompletedProjects(completedProjects);

            const counts = {
                active: activeProjects.filter(p => p.status === 'ACTIVE').length,
                pending: activeProjects.filter(p => p.status === 'PENDING').length,
                completed: completedProjects.length
            };
            setProjectCounts(counts);

        } catch (error: any) {
            console.error("Unexpected Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchMilestonePayment = async () => {
        if (!profile.profileId) return;

        try {
            const { data: orders, error: ordersErr } = await supabase
                .from('order')
                .select('id, title, client_id')
                .eq('visionary_id', profile.profileId);

            if (ordersErr) {
                console.error('Error fetching orders for milestones:', ordersErr);
                return;
            }

            const orderIds = (orders ?? []).map(o => o.id);
            if (orderIds.length === 0) {
                setMilestones([]);
                return;
            }

            const { data: mps, error: mpsErr } = await supabase
                .from('milestone_payment')
                .select('id, order_id, title, amount, status, due_date, created_at')
                .in('order_id', orderIds);

            if (mpsErr) {
                console.error('Error fetching milestone payments:', mpsErr);
                return;
            }

            // (Optional) enrich milestone rows with order/title/clientName
            // Build a quick lookup for order meta
            const orderById = new Map<string, { id: string, title?: string; client_id?: string }>();
            for (const o of orders ?? []) {
                orderById.set(o.id, { id: o.id, title: o.title, client_id: o.client_id });
            }

            const processed: Milestone[] = (mps ?? []).map((m: any) => {
                return {
                    id: `milestone_${m.id}`,
                    orderId: `order_${m.order_id}`,
                    title: m.title || 'Untitled Milestone',
                    amount: m.amount,
                    status: mapMilestoneStatus(m.status),
                    deadline: m.due_date,
                    createdAt: m.created_at,
                };
            });

            setMilestones(processed);
        } catch (e) {
            console.error('Unexpected Error:', e);
        }
    };

    useEffect(() => {
        handleFetchActiveProjects();
        handleFetchMilestonePayment()
    }, [profile.profileId]);

    const getProjectsByStatus = (status: 'ACTIVE' | 'PENDING' | 'IN REVIEW' | 'COMPLETED') => {
        if (status === 'COMPLETED') {
            return completedProjects;
        }
        return projects.filter(project => project.status === status);
    };

    return {
        projects,
        completedProjects,
        loading,
        projectCounts,
        getProjectsByStatus,
        milestones
    };
}