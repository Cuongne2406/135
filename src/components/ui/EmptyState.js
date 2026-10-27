'use client';
import React from 'react';
import { Inbox, RefreshCw } from 'lucide-react';

/**
 * Enterprise Minimalist EmptyState component
 * @param {React.ReactNode} icon - Lucide Icon component
 * @param {string} title - Main message title
 * @param {string} description - Detailed explanation or guidance
 * @param {string} actionText - Text for CTA button
 * @param {Function} onAction - Click handler for CTA button
 * @param {string} secondaryActionText - Text for secondary button
 * @param {Function} onSecondaryAction - Click handler for secondary button
 * @param {string} className - Extra container styling
 */
export default function EmptyState({
    icon: Icon = Inbox,
    title = 'Không tìm thấy dữ liệu',
    description = 'Hiện chưa có bản ghi nào hoặc kết quả tìm kiếm không khớp.',
    actionText,
    onAction,
    secondaryActionText,
    onSecondaryAction,
    className = ''
}) {
    return (
        <div className={`flex flex-col items-center justify-center p-10 my-4 text-center bg-white border border-dashed border-slate-200 rounded-lg ${className}`}>
            <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-slate-100 text-slate-500 ring-4 ring-slate-50">
                <Icon className="w-5 h-5 stroke-[1.75]" />
            </div>

            <h3 className="text-sm font-semibold text-slate-900 mb-1">
                {title}
            </h3>

            {description && (
                <p className="max-w-sm text-xs text-slate-500 mb-4 leading-relaxed">
                    {description}
                </p>
            )}

            {(actionText || secondaryActionText) && (
                <div className="flex items-center gap-2">
                    {secondaryActionText && onSecondaryAction && (
                        <button
                            type="button"
                            onClick={onSecondaryAction}
                            className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                            {secondaryActionText}
                        </button>
                    )}

                    {actionText && onAction && (
                        <button
                            type="button"
                            onClick={onAction}
                            className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium text-white bg-[var(--main_d)] rounded-md hover:bg-[var(--main_b)] transition-colors shadow-xs cursor-pointer"
                        >
                            {actionText}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
