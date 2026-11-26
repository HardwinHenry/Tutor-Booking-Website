import React, { useState, useEffect, useCallback } from 'react';
import { Eye, CheckCircle, XCircle, Award, ShieldCheck, BookOpen } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Textarea from '../../components/common/Textarea';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingState from '../../components/feedback/LoadingState';
import ErrorState from '../../components/feedback/ErrorState';
import { toast } from '../../components/feedback/ToastProvider';
import { adminService } from '../../services/admin.service';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const TABS = [
  { id: 'pending', label: 'Chờ duyệt' },
  { id: 'approved', label: 'Đã duyệt' },
  { id: 'rejected', label: 'Đã từ chối' },
  { id: 'all', label: 'Tất cả' },
];

export function AdminTutorApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [tutors, setTutors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail modal
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [verifiedQualIds, setVerifiedQualIds] = useState([]);

  // Approval actions
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchTutors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getTutors({
        approvalStatus: activeTab,
        search: search.trim() || undefined,
        page,
        limit: 10,
      });
      setTutors(data?.items || []);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách hồ sơ gia sư');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, search, page]);

  useEffect(() => {
    const timer = setTimeout(fetchTutors, 250);
    return () => clearTimeout(timer);
  }, [fetchTutors]);

  const handleOpenDetail = async (tutorRow) => {
    const id = tutorRow._id || tutorRow.userId?._id;
    setSelectedTutor(tutorRow);
    setIsDetailLoading(true);
    try {
      const detail = await adminService.getTutorDetail(id);
      setSelectedTutor(detail);
      setVerifiedQualIds(
        (detail?.qualifications || []).filter((q) => q.verified && q._id).map((q) => q._id)
      );
    } catch (err) {
      toast.error(err.message || 'Không thể tải chi tiết hồ sơ');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const toggleQualVerify = (qualId) => {
    setVerifiedQualIds((prev) =>
      prev.includes(qualId) ? prev.filter((id) => id !== qualId) : [...prev, qualId]
    );
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    setIsActionLoading(true);
    try {
      const id = approveTarget._id;
      await adminService.updateTutorApproval(id, {
        approvalStatus: 'approved',
        verifiedQualifications: selectedTutor?._id === id ? verifiedQualIds : undefined,
      });
      toast.success('Đã phê duyệt hồ sơ gia sư');
      setApproveTarget(null);
      setSelectedTutor(null);
      fetchTutors();
    } catch (err) {
      toast.error(err.message || 'Phê duyệt thất bại');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectTarget) return;
    if (rejectionReason.trim().length < 3) {
      toast.error('Vui lòng nhập lý do từ chối (tối thiểu 3 ký tự)');
      return;
    }

    setIsActionLoading(true);
    try {
      await adminService.updateTutorApproval(rejectTarget._id, {
        approvalStatus: 'rejected',
        rejectionReason: rejectionReason.trim(),
      });
      toast.success('Đã từ chối hồ sơ gia sư');
      setRejectTarget(null);
      setRejectionReason('');
      setSelectedTutor(null);
      fetchTutors();
    } catch (err) {
      toast.error(err.message || 'Không thể từ chối hồ sơ');
    } finally {
      setIsActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'userId',
      header: 'Gia sư',
      render: (user) => (
        <div>
          <p className="font-semibold text-slate-900">{user?.name || 'Chưa cập nhật'}</p>
          <p className="text-[11px] text-slate-500">{user?.email}</p>
        </div>
      ),
    },
    {
      key: 'expertise',
      header: 'Lĩnh vực & Môn dạy',
      render: (exp) => {
        const subjects = exp?.subjectIds || [];
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {exp?.categoryId?.name && (
              <Badge color="brand" size="sm">
                {exp.categoryId.name}
              </Badge>
            )}
            {subjects.slice(0, 2).map((s) => (
              <Badge key={s._id} color="slate" size="sm">
                {s.name}
              </Badge>
            ))}
            {subjects.length > 2 && (
              <span className="text-[11px] text-slate-400">+{subjects.length - 2}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'submittedAt',
      header: 'Ngày nộp',
      render: (val, row) => (
        <span className="text-xs text-slate-600">{formatDateTime(val || row.updatedAt)}</span>
      ),
    },
    {
      key: 'approvalStatus',
      header: 'Trạng thái',
      render: (val) => <StatusBadge type="tutorProfile" status={val} />,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenDetail(row)}
            title="Xem chi tiết hồ sơ"
            className="px-2.5"
          >
            <Eye className="w-3.5 h-3.5 mr-1" /> Chi tiết
          </Button>
          {row.approvalStatus !== 'approved' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => setApproveTarget(row)}
              title="Duyệt hồ sơ"
              className="px-2"
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </Button>
          )}
          {row.approvalStatus !== 'rejected' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setRejectTarget(row);
                setRejectionReason('');
              }}
              title="Từ chối hồ sơ"
              className="px-2"
            >
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Duyệt hồ sơ Gia sư</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Kiểm tra năng lực giảng dạy, bằng cấp và quyết định phê duyệt công khai hoặc từ chối kèm lý do
        </p>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex bg-slate-100 p-1 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            onClear={() => setSearch('')}
            placeholder="Tìm theo tên hoặc email gia sư..."
          />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchTutors} />
      ) : (
        <Card bodyClassName="p-0">
          <Table
            columns={columns}
            data={tutors}
            isLoading={isLoading}
            emptyMessage="Không có hồ sơ gia sư nào trong mục này."
            className="border-none rounded-none"
          />
          <div className="border-t border-slate-100 px-4">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              onPageChange={setPage}
            />
          </div>
        </Card>
      )}

      {/* Detail Inspection Modal */}
      <Modal
        isOpen={Boolean(selectedTutor)}
        onClose={() => setSelectedTutor(null)}
        title={`Chi tiết hồ sơ: ${selectedTutor?.userId?.name || 'Gia sư'}`}
        description={selectedTutor?.userId?.email}
        size="lg"
      >
        {isDetailLoading ? (
          <LoadingState message="Đang tải đầy đủ thông tin hồ sơ..." />
        ) : (
          selectedTutor && (
            <div className="space-y-5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Trạng thái:</span>
                  <StatusBadge type="tutorProfile" status={selectedTutor.approvalStatus} />
                </div>
                <div className="text-xs text-slate-500">
                  Kinh nghiệm: <strong>{selectedTutor.experienceYears ?? 0} năm</strong> • Tiến độ:{' '}
                  <strong>{selectedTutor.completionStatus}</strong>
                </div>
              </div>

              {selectedTutor.rejectionReason && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <strong>Lý do từ chối gần nhất:</strong> {selectedTutor.rejectionReason}
                </div>
              )}

              {/* Expertise */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Chuyên môn giảng dạy
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white border border-slate-200 rounded-xl p-3.5">
                  <div>
                    <span className="text-slate-500">Lĩnh vực:</span>{' '}
                    <strong>{selectedTutor.expertise?.categoryId?.name || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Học phí / 60p:</span>{' '}
                    <strong>
                      {selectedTutor.teachingConditions?.isNegotiable
                        ? 'Thương lượng'
                        : `${formatCurrency(selectedTutor.teachingConditions?.priceMin)} – ${formatCurrency(selectedTutor.teachingConditions?.priceMax)}`}
                    </strong>
                  </div>
                  <div className="sm:col-span-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-slate-500 mr-1">Môn dạy:</span>
                    {(selectedTutor.expertise?.subjectIds || []).map((s) => (
                      <Badge key={s._id} color="slate" size="sm">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="sm:col-span-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-slate-500 mr-1">Hình thức:</span>
                    {(selectedTutor.teachingConditions?.modes || []).map((m) => (
                      <Badge key={m._id} color="sky" size="sm">
                        {m.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Qualifications with admin verification toggle */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Bằng cấp / Chứng chỉ (tick để xác minh khi duyệt)
                </h4>
                {(selectedTutor.qualifications || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Gia sư chưa khai báo bằng cấp.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedTutor.qualifications.map((q, idx) => (
                      <label
                        key={q._id || idx}
                        className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
                      >
                        <div className="flex items-start gap-2.5">
                          {q._id && (
                            <input
                              type="checkbox"
                              checked={verifiedQualIds.includes(q._id)}
                              onChange={() => toggleQualVerify(q._id)}
                              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{q.title}</p>
                            <p className="text-slate-500">
                              {q.issuer || 'Đơn vị cấp không rõ'} {q.year ? `• Năm ${q.year}` : ''}
                            </p>
                          </div>
                        </div>
                        {verifiedQualIds.includes(q._id) && (
                          <Badge color="emerald" size="sm">
                            <ShieldCheck className="w-3 h-3 mr-1" /> Xác minh
                          </Badge>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Introduction */}
              {selectedTutor.introduction && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Giới thiệu bản thân
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 whitespace-pre-line">
                    {selectedTutor.introduction}
                  </p>
                </div>
              )}

              {/* Action footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="danger"
                  size="sm"
                  iconLeft={XCircle}
                  onClick={() => {
                    setRejectTarget(selectedTutor);
                    setRejectionReason('');
                  }}
                >
                  Từ chối hồ sơ
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  iconLeft={CheckCircle}
                  onClick={() => setApproveTarget(selectedTutor)}
                >
                  Phê duyệt hồ sơ
                </Button>
              </div>
            </div>
          )
        )}
      </Modal>

      {/* Approve Confirm */}
      <ConfirmDialog
        isOpen={Boolean(approveTarget)}
        onClose={() => !isActionLoading && setApproveTarget(null)}
        onConfirm={handleConfirmApprove}
        isLoading={isActionLoading}
        variant="info"
        title="Phê duyệt hồ sơ gia sư?"
        message={`Hồ sơ của "${approveTarget?.userId?.name || 'Gia sư'}" sẽ được công khai cho học viên tìm kiếm và đặt lịch.`}
        confirmText="Phê duyệt ngay"
      />

      {/* Reject Reason Modal */}
      <Modal
        isOpen={Boolean(rejectTarget)}
        onClose={() => !isActionLoading && setRejectTarget(null)}
        title="Từ chối hồ sơ gia sư"
        description={`Nhập lý do cụ thể để "${rejectTarget?.userId?.name || 'Gia sư'}" biết cần chỉnh sửa nội dung nào.`}
        size="sm"
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <Textarea
            label="Lý do từ chối"
            required
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Ví dụ: Vui lòng bổ sung mô tả kinh nghiệm giảng dạy và thông tin chứng chỉ cụ thể..."
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRejectTarget(null)}
              disabled={isActionLoading}
            >
              Hủy
            </Button>
            <Button type="submit" variant="danger" isLoading={isActionLoading}>
              Xác nhận từ chối
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminTutorApprovalsPage;

