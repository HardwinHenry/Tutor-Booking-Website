import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export function FeaturePlaceholderPage({
  title = 'Tính năng đang phát triển',
  stage = 'Giai đoạn kế tiếp',
  description = 'Chức năng này đã được định nghĩa trong Roadmap Frontend 2.0 và sẽ được tích hợp trong giai đoạn tương ứng.',
}) {
  const navigate = useNavigate();

  return (
    <div className="py-8">
      <Card className="max-w-xl mx-auto text-center p-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
          <Construction className="w-7 h-7" />
        </div>
        <Badge color="brand" className="mb-2">
          {stage}
        </Badge>
        <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">{description}</p>
        <Button variant="secondary" size="sm" iconLeft={ArrowLeft} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </Card>
    </div>
  );
}

export default FeaturePlaceholderPage;
