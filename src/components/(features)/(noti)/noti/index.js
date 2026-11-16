'use client';

export default function Noti({ open, onClose, status, mes, button }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center" onClick={onClose}>
      <div className="bg-[var(--bg-secondary)] p-4 w-[350px] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.26)] z-10 relative" onClick={e => e.stopPropagation()}>
        <h4 className="mt-4 mb-[-16px] text-center" style={{ color: status ? 'var(--green)' : 'var(--red)' }}>
          {status ? 'THÀNH CÔNG' : 'THẤT BẠI'}
        </h4>
        <div className="flex justify-center my-4">
          {status ? <IconSuccess /> : <IconFailure />}
        </div>
        <h5 className="px-4 pb-2 text-center -mt-3">{mes}</h5>
        <div>{button}</div>
      </div>
    </div>
  );
}

function IconSuccess() {
  return (
    <div className="w-20 h-20 mx-auto mb-2 relative flex items-center justify-center">
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="25" fill="none" stroke="#28a745" strokeWidth="5" strokeLinecap="round" />
        <path d="M22 32 l7 7 l13 -13" fill="none" stroke="#28a745" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

function IconFailure() {
  return (
    <div className="w-20 h-20 mx-auto mb-2 relative flex items-center justify-center">
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="25" fill="none" stroke="#dc3545" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-[3px] h-[22px] bg-[#dc3545] rotate-45" />
          <div className="absolute w-[3px] h-[22px] bg-[#dc3545] -rotate-45" />
        </div>
      </div>
    </div>
  );
};
