import Book from '@/models/book'
import connectDB from '@/config/connectDB'
import { cacheData } from '@/lib/cache'
import mongoose from 'mongoose';

async function dataBook(_id) {
    try {
        await connectDB();
        const pipeline = [];
        if (_id) { pipeline.push({ $match: { _id: new mongoose.Types.ObjectId(_id) } }) }
        pipeline.push({ $addFields: { Topics: { $filter: { input: "$Topics", as: "topic", cond: { $eq: ["$$topic.Status", true] } } } } });
        const books = await Book.aggregate(pipeline);
        if (_id && books.length === 0) return null;
        return _id ? JSON.parse(JSON.stringify(books[0])) : JSON.parse(JSON.stringify(books))
    } catch (error) {
        console.error('Lỗi trong dataBook:', error);
        throw new Error('Không thể lấy dữ liệu sách.');
    }
}

export async function getBookAll() {
    try {
        const cachedFunction = cacheData(() => dataBook(), ['books'])
        return await cachedFunction()
    } catch (error) {
        console.error('Lỗi trong BookAll:', error)
        return null
    }
}

export async function getBookOne(_id) {
    try {
        const cachedFunction = cacheData(() => dataBook(_id), [`book:${_id}`])
        return await cachedFunction()
    } catch (error) {
        console.error('Lỗi trong BookOne:', error)
        return null
    }
}

