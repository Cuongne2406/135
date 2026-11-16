'use server'
import { revalidateTag } from 'next/cache'
import { clearCacheByTag } from '@/lib/cache'

export async function reloadStudent(_id) {
    if (_id) { revalidateTag(`student:${_id}`, 'max'); clearCacheByTag(`student:${_id}`) }
    revalidateTag('students', 'max'); clearCacheByTag('students')
}

export async function reloadInvoice(_id) {
    if (_id) { revalidateTag(`invoice:${_id}`, 'max'); clearCacheByTag(`invoice:${_id}`) }
    revalidateTag('invoices', 'max'); clearCacheByTag('invoices')
}

export async function reloadArea(_id) {
    if (_id) { revalidateTag(`area:${_id}`, 'max'); clearCacheByTag(`area:${_id}`) }
    revalidateTag('areas', 'max'); clearCacheByTag('areas')
}

export async function reloadCourse(_id) {
    if (_id) { revalidateTag(`course:${_id}`, 'max'); clearCacheByTag(`course:${_id}`) }
    revalidateTag('courses', 'max'); clearCacheByTag('courses')
}

export async function reloadBook(_id) {
    if (_id) { revalidateTag(`book:${_id}`, 'max'); clearCacheByTag(`book:${_id}`) }
    revalidateTag('books', 'max'); clearCacheByTag('books')
}

export async function reloadCoursetry() {
    revalidateTag('coursetry', 'max'); clearCacheByTag('coursetry')
}

export async function reloadUser(_id) {
    if (_id) { revalidateTag(`user:${_id}`); clearCacheByTag(`user:${_id}`) }
    revalidateTag('users'); clearCacheByTag('users')
}

export async function reloadForm() {
    revalidateTag('forms', 'max'); clearCacheByTag('forms')
}

export async function reloadZalo() {
    revalidateTag('zalo', 'max'); clearCacheByTag('zalo')
}

export async function reloadLabel() {
    revalidateTag('labels', 'max'); clearCacheByTag('labels')
}

export async function reloadRunningSchedules() {
    revalidateTag('running-schedules', 'max'); clearCacheByTag('running-schedules')
}