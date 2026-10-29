'use server';
import fetchApi from '@/utils/fetchApi';
import { revalidateTag } from 'next/cache';
import { getLessonDetailData } from '@/data/database/lesson';

export async function Data_coursetry() {
    try {
        const res = await fetchApi(`/coursetry`, {
            method: 'GET',
            cache: "force-cache",
            next: { tags: [`data_coursetry`] }
        });

        return res.data || [];
    } catch (err) {
        return { data: [] };
    }
}

export async function Re_coursetry() {
    revalidateTag(`data_coursetry`, 'max');
}

export async function Data_calendar(month, year) {
    const url = month != '' && year != '' ? `/calendar?month=${month}&year=${year}` : `/calendar`;
    try {
        const res = await fetchApi(url, {
            method: 'GET',
            cache: "force-cache",
            next: { tags: [`data_calendar${month}-${year}`] }
        });

        return res.data || [];
    } catch (err) {
        return { data: [] };
    }
}

export async function Data_lesson(id) {
    try {
        const data = await getLessonDetailData(id);
        return data || { course: null, session: null, students: [] };
    } catch (err) {
        console.error('[Data_lesson Error]', err);
        return { course: null, session: null, students: [] };
    }
}

export async function Re_lesson(id) {
    revalidateTag(`data_lesson${id}`, 'max');
}

export async function Re_calendar(month, year) {
    revalidateTag(`data_calendar${month}-${year}`, 'max');
}
