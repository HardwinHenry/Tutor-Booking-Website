import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, CheckCircle2, Link2, Unlink, AlertCircle, RefreshCw } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { toast } from '../../../components/feedback/ToastProvider';
import { calendarService } from '../../../services/calendar.service';
import { formatDateTime } from '../../../utils/formatters';

/**
 * Shared Google Calendar Connection & Sync Summary panel for Learner and Tutor
 */
export function CalendarConnectionPanel({ roleLabel = 'lịch học' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusData, setStatusData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await calendarService.getStatus();
      setStatusData(data);
    } catch (err) {
      setError(err.message || 'Không thể tải trạng thái kết nối Google Calendar');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const oauthResult = searchParams.get('status') || searchParams.get('calendar');
    if (oauthResult === 'connected' || oauthResult === 'success') {
      toast.success('Đã liên kết tài khoản Google Calendar thành công!');
      searchParams.delete('status');
      searchParams.delete('calendar');
      setSearchParams(searchParams, { replace: true });
    } else if (oauthResult === 'error' || oauthResult === 'failed') {
      toast.error('Kết nối Google Calendar không thành công. Vui lòng thử lại.');
      searchParams.delete('status');
      searchParams.delete('calendar');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const data = await calendarService.getOAuthUrl();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Backend chưa trả về liên kết xác thực Google OAuth.');
      }
    } catch (err) {
      toast.error(err.message || 'Không thể khởi tạo kết nối Google OAuth');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await calendarService.disconnect();
      toast.success('Đã ngắt kết nối Google Calendar');
      setShowDisconnectConfirm(false);
      fetchStatus();
    } catch (err) {
      toast.error(err.message || 'Không thể ngắt kết nối');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) return <LoadingState message="Đang kiểm tra kết nối Google Calendar..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStatus} />;

  const isConnected = Boolean(statusData?.connected);
  const summary = statusData?.syncSummary || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Kết nối Google Calendar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự động thêm sự kiện và nhắc nhở {roleLabel} khi booking được xác nhận (confirmed)
          </p>
        </div>

        <Button variant="secondary" size="sm" iconLeft={RefreshCw} onClick={fetchStatus}>
          Làm mới trạng thái
        </Button>
      </div>

      {/* Main Connection Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                isConnected
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Calendar className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">Trạng thái liên kết tài khoản</h2>
                {isConnected ? (
                  <Badge color="emerald" dot>
                    Đã kết nối
                  </Badge>
                ) : statusData?.status === 'revoked' ? (
                  <Badge color="rose" dot>
                    Quyền truy cập đã bị thu hồi
                  </Badge>
                ) : (
                  <Badge color="slate">Chưa kết nối</Badge>
                )}
              </div>

              {isConnected && statusData?.email && (
                <p className="text-sm font-medium text-slate-700">
                  Tài khoản Google: <strong>{statusData.email}</strong>
                </p>
              )}

              {statusData?.lastConnectedAt && isConnected && (
                <p className="text-xs text-slate-400">
                  Kết nối lần cuối: {formatDateTime(statusData.lastConnectedAt)}
                </p>
              )}

              {!isConnected && (
                <p className="text-xs text-slate-500 max-w-xl">
                  Khi bạn kết nối Google Calendar, mọi buổi học chuyển sang trạng thái đã xác nhận sẽ được hệ thống tự động tạo sự kiện lịch trên Google. Toàn bộ token bảo mật được lưu trữ an toàn phía Backend.
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0">
            {isConnected ? (
              <Button
                variant="danger"
                size="sm"
                iconLeft={Unlink}
                onClick={() => setShowDisconnectConfirm(true)}
              >
                Ngắt kết nối
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                iconLeft={Link2}
                isLoading={isConnecting}
                onClick={handleConnect}
              >
                Kết nối Google Calendar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Sync Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-[11px] font-medium text-slate-500">Tổng sự kiện đồng bộ</p>
          <p className="text-xl font-black text-slate-900 mt-1">{summary.total || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium text-emerald-600">Đã đồng bộ thành công</p>
          <p className="text-xl font-black text-emerald-700 mt-1">{summary.synced || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium text-amber-600">Đang chờ xử lý</p>
          <p className="text-xl font-black text-amber-700 mt-1">{summary.pending || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium text-rose-600">Đồng bộ thất bại</p>
          <p className="text-xl font-black text-rose-700 mt-1">{summary.failed || 0}</p>
        </Card>
      </div>

      {/* Info Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
        <AlertCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-800">Lưu ý về tính độc lập của Booking & Calendar</p>
          <p>
            Google Calendar là tính năng hỗ trợ nhắc lịch. Nếu quá trình đồng bộ gặp sự cố tạm thời, trạng thái booking đã xác nhận vẫn hoàn toàn có hiệu lực và bạn có thể bấm "Thử đồng bộ lại" ngay trong chi tiết từng booking.
          </p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDisconnectConfirm}
        onClose={() => !isDisconnecting && setShowDisconnectConfirm(false)}
        onConfirm={handleDisconnect}
        isLoading={isDisconnecting}
        title="Ngắt kết nối Google Calendar?"
        message="Hệ thống sẽ ngừng tự động đồng bộ các buổi học mới lên Google Calendar của bạn cho tới khi bạn kết nối lại."
        confirmText="Ngắt kết nối"
      />
    </div>
  );
}

export default CalendarConnectionPanel;

