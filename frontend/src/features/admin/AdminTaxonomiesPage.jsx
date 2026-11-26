import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Power, Tag } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ErrorState from '../../components/feedback/ErrorState';
import { toast } from '../../components/feedback/ToastProvider';
import { taxonomyService } from '../../services/taxonomy.service';
import { adminService } from '../../services/admin.service';
import { TAXONOMY_TYPES } from '../../constants';

const INITIAL_FORM = {
  name: '',
  type: 'category',
  slug: '',
  parentId: '',
  sortOrder: 0,
  description: '',
  active: true,
};

export function AdminTaxonomiesPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [parentOptions, setParentOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle status dialog
  const [toggleTarget, setToggleTarget] = useState(null);
  const [isToggling, setIsToggling] = useState(false);

  const fetchTaxonomies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (activeFilter !== '') params.active = activeFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await taxonomyService.getTaxonomies(params);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách Taxonomy');
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, activeFilter, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTaxonomies();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTaxonomies]);

  // Load potential parent options when editing Subject (needs category) or Topic (needs subject)
  useEffect(() => {
    if (!isModalOpen) return;
    let parentType = null;
    if (form.type === 'subject') parentType = 'category';
    else if (form.type === 'topic') parentType = 'subject';

    if (!parentType) {
      setParentOptions([]);
      return;
    }

    taxonomyService
      .getTaxonomies({ type: parentType })
      .then((list) => {
        setParentOptions(
          (list || []).map((t) => ({
            value: t._id,
            label: `${t.name}${t.active === false ? ' (Đã ẩn)' : ''}`,
          }))
        );
      })
      .catch(() => setParentOptions([]));
  }, [isModalOpen, form.type]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({
      ...INITIAL_FORM,
      type: typeFilter || 'category',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || '',
      type: item.type || 'category',
      slug: item.slug || '',
      parentId: item.parentId?._id || item.parentId || '',
      sortOrder: item.sortOrder ?? 0,
      description: item.description || '',
      active: item.active !== false,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Tên danh mục là bắt buộc');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        active: Boolean(form.active),
        description: form.description?.trim() || '',
      };

      if (form.slug.trim()) payload.slug = form.slug.trim().toLowerCase();
      if (form.parentId) payload.parentId = form.parentId;
      else if (editingItem) payload.parentId = null;

      if (editingItem) {
        await adminService.updateTaxonomy(editingItem._id, payload);
        toast.success('Cập nhật danh mục thành công');
      } else {
        payload.type = form.type;
        await adminService.createTaxonomy(payload);
        toast.success('Tạo danh mục mới thành công');
      }

      setIsModalOpen(false);
      fetchTaxonomies();
    } catch (err) {
      toast.error(err.message || 'Không thể lưu danh mục');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setIsToggling(true);
    try {
      const nextActive = toggleTarget.active === false;
      await adminService.updateTaxonomy(toggleTarget._id, { active: nextActive });
      toast.success(nextActive ? 'Đã kích hoạt lại danh mục' : 'Đã ẩn danh mục');
      setToggleTarget(null);
      fetchTaxonomies();
    } catch (err) {
      toast.error(err.message || 'Không thể thay đổi trạng thái danh mục');
    } finally {
      setIsToggling(false);
    }
  };

  const getTypeLabel = (typeVal) => {
    const found = TAXONOMY_TYPES.find((t) => t.value === typeVal);
    return found ? found.label : typeVal;
  };

  const columns = [
    {
      key: 'name',
      header: 'Tên danh mục',
      render: (val, row) => (
        <div>
          <p className="font-semibold text-slate-900">{val}</p>
          <p className="text-[11px] text-slate-400 font-mono">{row.slug}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Loại (Type)',
      render: (val) => (
        <Badge color="brand" size="sm">
          {getTypeLabel(val)}
        </Badge>
      ),
    },
    {
      key: 'parentId',
      header: 'Danh mục cha',
      render: (val) => (
        <span className="text-xs text-slate-600">
          {val?.name || (typeof val === 'string' && val ? val : '—')}
        </span>
      ),
    },
    {
      key: 'sortOrder',
      header: 'Thứ tự',
      align: 'center',
      render: (val) => <span className="text-xs font-medium text-slate-600">{val ?? 0}</span>,
    },
    {
      key: 'active',
      header: 'Trạng thái',
      render: (val) =>
        val !== false ? (
          <Badge color="emerald" dot>
            Đang hoạt động
          </Badge>
        ) : (
          <Badge color="slate">Đã ẩn (Inactive)</Badge>
        ),
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
            onClick={() => openEditModal(row)}
            title="Chỉnh sửa"
            className="px-2.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={row.active !== false ? 'danger' : 'success'}
            size="sm"
            onClick={() => setToggleTarget(row)}
            title={row.active !== false ? 'Ẩn danh mục' : 'Kích hoạt lại'}
            className="px-2.5"
          >
            <Power className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quản lý Taxonomy & Tags</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý danh mục lĩnh vực, môn học, chuyên môn, cấp độ và tiêu chí dùng chung cho Onboarding & Tìm kiếm
          </p>
        </div>
        <Button variant="primary" size="sm" iconLeft={Plus} onClick={openCreateModal}>
          Thêm danh mục
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm('')}
              placeholder="Tìm theo tên hoặc slug..."
            />
          </div>
          <div className="md:col-span-4">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              placeholder="Tất cả loại danh mục"
              options={TAXONOMY_TYPES}
            />
          </div>
          <div className="md:col-span-3">
            <Select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              placeholder="Tất cả trạng thái"
              options={[
                { value: 'true', label: 'Đang hoạt động' },
                { value: 'false', label: 'Đã ẩn (Inactive)' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      {error ? (
        <ErrorState message={error} onRetry={fetchTaxonomies} />
      ) : (
        <Card
          title={`Danh sách Taxonomy (${items.length})`}
          subtitle="Lưu ý: Không xóa cứng danh mục đã tham chiếu; chỉ tắt trạng thái hoạt động (inactive)."
          bodyClassName="p-0"
        >
          <Table
            columns={columns}
            data={items}
            isLoading={isLoading}
            emptyMessage="Không tìm thấy danh mục phù hợp."
            className="border-none rounded-none"
          />
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingItem ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
        description="Dữ liệu taxonomy được dùng đồng bộ cho bộ 28 câu hỏi và bộ lọc tìm kiếm."
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Select
            label="Loại danh mục (Type)"
            required
            disabled={Boolean(editingItem)}
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, parentId: '' }))}
            options={TAXONOMY_TYPES}
          />

          {(form.type === 'subject' || form.type === 'topic') && (
            <Select
              label={form.type === 'subject' ? 'Thuộc lĩnh vực (Category)' : 'Thuộc môn học (Subject)'}
              value={form.parentId}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
              placeholder="Chọn danh mục cha..."
              options={parentOptions}
            />
          )}

          <Input
            label="Tên hiển thị"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ví dụ: Toán học, Luyện thi IELTS..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Slug (tùy chọn)"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="Tự động tạo nếu để trống"
            />
            <Input
              label="Thứ tự hiển thị"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>

          <Textarea
            label="Mô tả ngắn"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Mô tả ý nghĩa danh mục nếu cần..."
          />

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Kích hoạt hiển thị (Active)</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} iconLeft={Tag}>
              {editingItem ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toggle Active Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(toggleTarget)}
        onClose={() => !isToggling && setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        isLoading={isToggling}
        variant={toggleTarget?.active !== false ? 'danger' : 'info'}
        title={toggleTarget?.active !== false ? 'Ẩn danh mục này?' : 'Kích hoạt lại danh mục?'}
        message={
          toggleTarget?.active !== false
            ? `Danh mục "${toggleTarget?.name}" sẽ bị ẩn khỏi các biểu mẫu mới nhưng dữ liệu lịch sử đã tham chiếu vẫn được giữ nguyên.`
            : `Danh mục "${toggleTarget?.name}" sẽ hiển thị trở lại trong hệ thống.`
        }
        confirmText={toggleTarget?.active !== false ? 'Ẩn danh mục' : 'Kích hoạt'}
      />
    </div>
  );
}

export default AdminTaxonomiesPage;

