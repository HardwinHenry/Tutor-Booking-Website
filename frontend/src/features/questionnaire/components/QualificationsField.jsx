import React, { useState } from 'react';
import { Plus, Trash2, Award, ExternalLink } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';

/**
 * Qualifications & Certificates Field for Tutor Q24
 */
export function QualificationsField({
  qualifications = [],
  onChange,
  certificateTypes = [],
}) {
  const [newTitle, setNewTitle] = useState('');
  const [newIssuer, setNewIssuer] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCertTypeId, setNewCertTypeId] = useState('');
  const [formError, setFormError] = useState('');

  const handleAdd = () => {
    setFormError('');
    if (!newTitle.trim()) {
      setFormError('Vui lòng nhập tên chứng chỉ / bằng cấp');
      return;
    }

    const item = {
      title: newTitle.trim(),
      issuer: newIssuer.trim(),
      issueYear: newYear ? parseInt(newYear, 10) : null,
      credentialUrl: newUrl.trim(),
      certificateType: newCertTypeId || null,
      verified: false,
    };

    onChange([...qualifications, item]);

    // Reset inputs
    setNewTitle('');
    setNewIssuer('');
    setNewYear('');
    setNewUrl('');
    setNewCertTypeId('');
  };

  const handleRemove = (index) => {
    onChange(qualifications.filter((_, idx) => idx !== index));
  };

  const certTypeOptions = [
    { value: '', label: '-- Chọn loại bằng cấp/chứng chỉ --' },
    ...certificateTypes.map((c) => ({
      value: c._id || c.id,
      label: c.name || c.label,
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Existing list */}
      {qualifications.length > 0 ? (
        <div className="space-y-2">
          {qualifications.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="font-bold text-slate-800">{item.title}</span>
                  {item.issueYear && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-[10px] text-slate-600 font-semibold">
                      Năm {item.issueYear}
                    </span>
                  )}
                </div>
                {item.issuer && (
                  <p className="text-slate-500 text-[11px] pl-6">
                    Đơn vị cấp: <span className="font-medium text-slate-700">{item.issuer}</span>
                  </p>
                )}
                {item.credentialUrl && (
                  <a
                    href={item.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-[11px] text-brand-600 hover:underline pl-6"
                  >
                    <span>Xem liên kết chứng thực</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                title="Xóa chứng chỉ này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
          Chưa có bằng cấp hoặc chứng chỉ nào được thêm (không bắt buộc).
        </div>
      )}

      {/* Add new qualification form */}
      <div className="p-4 border border-brand-100 bg-brand-50/20 rounded-xl space-y-3">
        <span className="text-xs font-bold text-brand-900 block">
          Thêm bằng cấp hoặc chứng chỉ mới
        </span>

        {formError && (
          <p className="text-xs text-rose-600 font-medium">{formError}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Tên bằng cấp / Chứng chỉ *"
            placeholder="Ví dụ: IELTS 8.0, Cử nhân Sư phạm..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <Input
            label="Đơn vị cấp"
            placeholder="Ví dụ: British Council, ĐH Sư Phạm..."
            value={newIssuer}
            onChange={(e) => setNewIssuer(e.target.value)}
          />

          <Input
            label="Năm cấp"
            type="number"
            placeholder="2023"
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
          />

          <Select
            label="Phân loại chứng chỉ"
            value={newCertTypeId}
            onChange={(e) => setNewCertTypeId(e.target.value)}
            options={certTypeOptions}
          />
        </div>

        <Input
          label="Link chứng thực / Hồ sơ online (nếu có)"
          type="url"
          placeholder="https://..."
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
        />

        <div className="flex justify-end pt-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAdd}
            iconLeft={Plus}
          >
            Thêm vào danh sách
          </Button>
        </div>
      </div>
    </div>
  );
}

export default QualificationsField;
