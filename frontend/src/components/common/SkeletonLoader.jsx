import React from 'react';

export default function SkeletonLoader({
  type = 'card', // 'card', 'table-row', 'stat', 'text'
  count = 1,
  height = 'auto',
  className = '',
}) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'table-row') {
    return (
      <>
        {items.map((key) => (
          <tr key={key} className="border-bottom border-outline-variant">
            <td className="py-3 px-3"><div className="skeleton-box" style={{ height: '18px', width: '80px' }}></div></td>
            <td className="py-3 px-3"><div className="skeleton-box" style={{ height: '18px', width: '140px' }}></div></td>
            <td className="py-3 px-3"><div className="skeleton-box" style={{ height: '18px', width: '100px' }}></div></td>
            <td className="py-3 px-3"><div className="skeleton-box" style={{ height: '18px', width: '90px' }}></div></td>
            <td className="py-3 px-3"><div className="skeleton-box" style={{ height: '22px', width: '110px', borderRadius: '100px' }}></div></td>
            <td className="py-3 px-3 text-end"><div className="skeleton-box ms-auto" style={{ height: '28px', width: '60px' }}></div></td>
          </tr>
        ))}
      </>
    );
  }

  if (type === 'stat') {
    return (
      <div className="row g-3">
        {items.map((key) => (
          <div key={key} className="col-12 col-sm-6 col-lg-3">
            <div className="sh-card p-3">
              <div className="skeleton-box mb-2" style={{ height: '14px', width: '60%' }}></div>
              <div className="skeleton-box mb-2" style={{ height: '32px', width: '40%' }}></div>
              <div className="skeleton-box" style={{ height: '12px', width: '75%' }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`row g-3 ${className}`}>
      {items.map((key) => (
        <div key={key} className="col-12 col-md-6 col-lg-4">
          <div className="sh-card p-3" style={{ height: height !== 'auto' ? height : '180px' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="skeleton-box rounded-circle" style={{ width: '44px', height: '44px' }}></div>
              <div className="flex-grow-1">
                <div className="skeleton-box mb-1" style={{ height: '16px', width: '70%' }}></div>
                <div className="skeleton-box" style={{ height: '12px', width: '40%' }}></div>
              </div>
            </div>
            <div className="skeleton-box mb-2" style={{ height: '14px', width: '90%' }}></div>
            <div className="skeleton-box mb-2" style={{ height: '14px', width: '80%' }}></div>
            <div className="skeleton-box mt-3" style={{ height: '8px', width: '100%' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}
