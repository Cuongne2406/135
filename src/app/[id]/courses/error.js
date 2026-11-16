// app/[id]/overview/error.js
"use client";

import { useEffect } from "react";

export default function ErrorOverview({ error, reset }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div>
            <h2>Có lỗi xảy ra ở tab Tổng quan</h2>
            <button onClick={() => reset()}>Thử lại</button>
        </div>
    );
}
