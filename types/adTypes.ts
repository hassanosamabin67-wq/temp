/**
 * TypeScript types for Kaboom Collab Ad System
 */

import { AdStatus, PaymentStatus, ViewType } from '@/utils/constants/adConstants';

// ========================================
// AD TYPES
// ========================================

export interface Ad {
    id: string;
    room_id: string;
    session_id?: string;
    advertiser_id: string;

    // Video details
    video_url: string;
    video_duration: number;
    video_format: 'mp4' | 'mov';
    video_size_bytes?: number;

    // Ad content
    title: string;
    description?: string;

    // Status management
    status: AdStatus;
    approved_at?: string;
    approved_by?: string;
    rejection_reason?: string;

    // Impression tracking
    impressions_count: number;
    lobby_impressions: number;
    replay_impressions: number;

    // Timestamps
    created_at: string;
    updated_at: string;
    expires_at?: string;

    // Metadata
    metadata?: Record<string, any>;
}

export interface AdWithDetails extends Ad {
    advertiser?: {
        userId: string;
        firstName: string;
        lastName: string;
        email: string;
        profileImage?: string;
    };
    room?: {
        id: string;
        title: string;
        host: string;
    };
    session?: {
        id: string;
        event_name: string;
        event_date: string;
    };
    purchase?: AdPurchase;
}

// ========================================
// AD PURCHASE TYPES
// ========================================

export interface AdPurchase {
    id: string;
    ad_id: string;
    advertiser_id: string;
    visionary_id: string;

    // Payment details
    stripe_payment_intent_id: string;
    stripe_charge_id?: string;
    amount: number;
    kaboom_split: number;
    visionary_split: number;

    // Payment status
    payment_status: PaymentStatus;
    paid_at?: string;

    // Stripe transfer details
    stripe_transfer_id?: string;
    transfer_status: 'pending' | 'completed' | 'failed';
    transferred_at?: string;

    // Timestamps
    created_at: string;
    updated_at: string;

    // Metadata
    metadata?: Record<string, any>;
}

// ========================================
// AD IMPRESSION TYPES
// ========================================

export interface AdImpression {
    id: string;
    ad_id: string;
    session_id?: string;

    // Viewer details
    viewer_id?: string;
    viewer_ip?: string;

    // Impression details
    view_type: ViewType;
    view_duration?: number;
    completed: boolean;

    // Timestamps
    impression_date: string;

    // Metadata
    metadata?: Record<string, any>;
}

// ========================================
// REQUEST/RESPONSE TYPES
// ========================================

export interface CreateAdRequest {
    room_id: string;
    session_id?: string;
    title: string;
    description?: string;
    video_file: File;
}

export interface UploadAdVideoResponse {
    videoUrl: string;
    duration: number;
    format: string;
    sizeBytes: number;
}

export interface CreateAdResponse {
    success: boolean;
    ad?: Ad;
    error?: string;
}

export interface AdPaymentRequest {
    ad_id: string;
    advertiser_id: string;
    visionary_id: string;
}

export interface AdPaymentResponse {
    success: boolean;
    clientSecret?: string;
    paymentIntentId?: string;
    error?: string;
}

export interface ApproveAdRequest {
    ad_id: string;
    admin_id: string;
}

export interface RejectAdRequest {
    ad_id: string;
    admin_id: string;
    rejection_reason: string;
}

export interface AdActionResponse {
    success: boolean;
    message: string;
    error?: string;
}

export interface RecordImpressionRequest {
    ad_id: string;
    session_id?: string;
    viewer_id?: string;
    view_type: ViewType;
    view_duration?: number;
    completed?: boolean;
}

export interface GetActiveAdsRequest {
    room_id: string;
    session_id?: string;
    view_type: ViewType;
}

export interface GetActiveAdsResponse {
    ads: Ad[];
    count: number;
}

// ========================================
// ADMIN DASHBOARD TYPES
// ========================================

export interface AdStatistics {
    totalAds: number;
    pendingAds: number;
    activeAds: number;
    rejectedAds: number;
    expiredAds: number;
    totalRevenue: number;
    totalImpressions: number;
    averageImpressions: number;
}

export interface AdFilterOptions {
    status?: AdStatus;
    room_id?: string;
    advertiser_id?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
}

// ========================================
// USER DASHBOARD TYPES
// ========================================

export interface UserAdStats {
    totalAds: number;
    activeAds: number;
    totalSpent: number;
    totalImpressions: number;
    pendingApprovals: number;
}

export interface RoomOption {
    id: string;
    title: string;
    sessions: SessionOption[];
}

export interface SessionOption {
    id: string;
    event_name: string;
    event_date: string;
    event_start_time: string;
    available_slots: number;
}

// ========================================
// VALIDATION TYPES
// ========================================

export interface VideoValidationResult {
    isValid: boolean;
    duration?: number;
    format?: string;
    sizeBytes?: number;
    errors: string[];
}

export interface AdSlotAvailability {
    available: boolean;
    slotsRemaining: number;
    totalSlots: number;
    message?: string;
}

// ========================================
// BILLING TYPES
// ========================================

export interface Invoice {
    id: string;
    ad_id: string;
    amount: number;
    payment_status: 'pending' | 'succeeded' | 'failed' | 'refunded';
    paid_at?: string;
    created_at: string;
    stripe_payment_intent_id: string;
    stripe_charge_id?: string;
    ad_title: string;
    room_title: string;
}

export interface PaymentMethodDetails {
    brand?: string;
    last4?: string;
    exp_month?: number;
    exp_year?: number;
    type?: string;
}

export interface BillingInvoicesResponse {
    success: boolean;
    invoices: Invoice[];
    count: number;
    error?: string;
}

export interface PaymentMethodResponse {
    success: boolean;
    paymentMethod?: PaymentMethodDetails;
    error?: string;
}