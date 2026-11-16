'use client';
import React from 'react';

/**
 * Enterprise Minimalist Skeleton Table loader
 * @param {number} rows - Number of skeleton rows to display
 * @param {number} columns - Number of columns to display
 * @param {Array<string>} headers - Optional column header titles
 * @param {string} className - Optional container className
 */
export default function SkeletonTable({
    rows = 6,
    columns = 5,
    headers = null,
    className = ''
}) {
    const colCount = headers ? headers.length : columns;
    const dummyRows = Array.from({ length: rows });
    const dummyCols = Array.from({ length: colCount });

    // Varying widths for natural text skeleton feel
    const widthVariants = ['w-24', 'w-32', 'w-20', 'w-40', 'w-16', 'w-28'];

    return (
        <div className={`w-full bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                            {dummyCols.map((_, i) => (
                                <th key={i} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {headers && headers[i] ? (
                                        headers[i]
                                    ) : (
                                        <div className="h-3.5 bg-slate-200 rounded animate-pulse w-20" />
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {dummyRows.map((_, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                                {dummyCols.map((_, cIdx) => (
                                    <td key={cIdx} className="px-4 py-3.5 whitespace-nowrap">
                                        <div
                                            className={`h-4 bg-slate-200 rounded animate-pulse ${
                                                widthVariants[(rIdx + cIdx) % widthVariants.length]
                                            }`}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
