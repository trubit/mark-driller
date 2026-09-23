import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useMySubscriptionQuery, useMyPaymentsQuery } from '../api/subscriptions.js';

interface NotificationItem {
  id: string;
  type: 'VERIFICATION' | 'SUBSCRIPTION' | 'PAYMENT' | 'ANNOUNCEMENT';
  title: string;
  message: string;
  time: string;
  actionText?: string;
  actionLink?: string;
  isUrgent?: boolean;
}

export const PortalNotificationPopover: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('md_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const popoverRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { data: subscription } = useMySubscriptionQuery();
  const { data: payments } = useMyPaymentsQuery();

  // Compute real notifications strictly from server state
  const notifications: NotificationItem[] = useMemo(() => {
    if (!user) return [];
    const list: NotificationItem[] = [];

    // 1. Email Verification
    if (!user.isVerified) {
      list.push({
        id: 'notif_verify_email',
        type: 'VERIFICATION',
        title: 'Action Required: Email Unverified',
        message: 'Confirm your registered email address to secure your mock exam records and activation receipts.',
        time: 'Account Notice',
        actionText: 'Verify Now ➔',
        actionLink: '/settings?tab=security',
        isUrgent: true,
      });
    }

    // 2. Pending Bank Transfer Payment
    const pendingPayment = payments?.find((p) => p.status === 'PENDING_REVIEW');
    if (pendingPayment) {
      list.push({
        id: `notif_pending_${pendingPayment.reference}`,
        type: 'PAYMENT',
        title: 'Bank Transfer Proof Under Review',
        message: `Your payment proof (Ref: ${pendingPayment.reference}) is currently pending admin review.`,
        time: 'Payment Ledger',
        actionText: 'Check Status ➔',
        actionLink: '/settings?tab=subscription',
        isUrgent: false,
      });
    }

    // 3. Subscription Status
    if (!subscription?.isPro) {
      list.push({
        id: 'notif_pro_upgrade',
        type: 'SUBSCRIPTION',
        title: 'Unlock 30,000+ Past Questions',
        message: 'You are using the Free Starter tier. Upgrade to Pro Scholar for unlimited CBT mocks and worked solutions.',
        time: 'Preparation Boost',
        actionText: 'Explore Pro Plans ➔',
        actionLink: '/portal/pricing',
        isUrgent: false,
      });
    } else if (subscription?.endDate) {
      const daysLeft = Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7 && daysLeft >= 0) {
        list.push({
          id: 'notif_sub_expiry',
          type: 'SUBSCRIPTION',
          title: `Pro Subscription Expires in ${daysLeft} Day(s)`,
          message: 'Renew your subscription to maintain uninterrupted access to the complete question bank.',
          time: 'Renewal Notice',
          actionText: 'Renew Subscription ➔',
          actionLink: '/portal/pricing',
          isUrgent: true,
        });
      }
    }

    // 4. Academic Season Notice
    list.push({
      id: 'notif_season_2026',
      type: 'ANNOUNCEMENT',
      title: '2026 Curriculum Syllabus Active',
      message: 'JAMB UTME, WAEC WASSCE, and NECO question banks are updated with the official 2026 syllabus guidelines.',
      time: 'Academic Advisory',
      actionText: 'View Guides ➔',
      actionLink: '/portal/blog',
      isUrgent: false,
    });

    return list;
  }, [user, subscription, payments]);

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem('md_read_notifications', JSON.stringify(allIds));
    } catch {
      // Storage error ignore
    }
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={popoverRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Student notifications and alerts"
        style={{
          background: 'none',
          border: '1px solid var(--paper-line)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--ink)',
          fontSize: '16px',
          position: 'relative',
          backgroundColor: isOpen ? 'var(--paper)' : 'var(--white)',
          transition: 'all 0.15s ease',
          boxShadow: 'var(--shadow)',
        }}
      >
        <span>🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "var(--font-sans)",
              border: '2px solid var(--white)',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '340px',
            backgroundColor: 'var(--white)',
            border: '1.5px solid var(--paper-line)',
            borderRadius: '10px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.2)',
            zIndex: 1150,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--paper-line)',
              backgroundColor: 'var(--paper)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)', fontFamily: "var(--font-sans)" }}>
                Notification Center
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'rgba(220, 38, 38, 0.12)',
                    color: '#dc2626',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--forest, #225a38)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              notifications.map((n) => {
                const isRead = readIds.includes(n.id);
                return (
                  <div
                    key={n.id}
                    style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--paper-line)',
                      backgroundColor: isRead ? 'transparent' : 'var(--paper)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: n.isUrgent ? '#dc2626' : 'var(--ink)',
                          fontFamily: "var(--font-sans)",
                          lineHeight: 1.3,
                        }}
                      >
                        {n.title}
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--ink-soft)', fontFamily: "var(--font-sans)" }}>
                        {n.time}
                      </span>
                    </div>

                    <p style={{ fontSize: '12.5px', color: 'var(--ink-soft)', margin: '0 0 8px 0', lineHeight: 1.45 }}>
                      {n.message}
                    </p>

                    {n.actionLink && n.actionText && (
                      <Link
                        to={n.actionLink}
                        onClick={() => {
                          setIsOpen(false);
                          if (!readIds.includes(n.id)) {
                            const updated = [...readIds, n.id];
                            setReadIds(updated);
                            localStorage.setItem('md_read_notifications', JSON.stringify(updated));
                          }
                        }}
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--forest, #225a38)',
                          textDecoration: 'none',
                        }}
                      >
                        {n.actionText}
                      </Link>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>✨</div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>All caught up!</div>
                <div style={{ fontSize: '12px' }}>No unread account notifications.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

