'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const ParentContext = createContext(null);

export function ParentProvider({ children }) {
    const router = useRouter();
    const [overviewData, setOverviewData] = useState(null);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState(false);

    const fetchOverview = useCallback(async (courseIdOverride) => {
        try {
            const cId = courseIdOverride !== undefined ? courseIdOverride : selectedCourseId;
            const url = cId ? `/api/parent/overview?courseId=${cId}` : '/api/parent/overview';
            const res = await fetch(url);
            if (res.status === 401) {
                router.push('/parent/login');
                return null;
            }
            const data = await res.json();
            if (data.success) {
                setOverviewData(data);
                if (data.course?._id && !cId) {
                    setSelectedCourseId(data.course._id);
                }
                return data;
            }
            return null;
        } catch (err) {
            console.error('Lỗi tải dữ liệu phụ huynh:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [router, selectedCourseId]);

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    const selectCourse = useCallback(async (courseId) => {
        setSelectedCourseId(courseId);
        await fetchOverview(courseId);
    }, [fetchOverview]);

    const switchStudent = useCallback(async (studentId) => {
        setSwitching(true);
        setSelectedCourseId(null);
        try {
            const phone = overviewData?.student?.Phone;
            const res = await fetch('/api/parent/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    activeStudentId: studentId
                })
            });

            if (res.ok) {
                await fetchOverview(null);
            }
        } catch (err) {
            console.error('Lỗi chuyển đổi học viên:', err);
        } finally {
            setSwitching(false);
        }
    }, [overviewData?.student?.Phone, fetchOverview]);

    const logout = useCallback(async () => {
        try {
            await fetch('/api/parent/auth', { method: 'DELETE' });
            router.push('/parent/login');
        } catch {
            router.push('/parent/login');
        }
    }, [router]);

    return (
        <ParentContext.Provider
            value={{
                overviewData,
                selectedCourseId: selectedCourseId || overviewData?.course?._id,
                selectCourse,
                courses: overviewData?.courses || [],
                loading,
                switching,
                activeStudentId: overviewData?.student?.ID,
                switchStudent,
                refreshOverview: fetchOverview,
                logout
            }}
        >
            {children}
        </ParentContext.Provider>
    );
}

export function useParent() {
    const context = useContext(ParentContext);
    if (!context) {
        throw new Error('useParent phải được sử dụng bên trong ParentProvider');
    }
    return context;
}
