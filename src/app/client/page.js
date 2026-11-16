import { Suspense } from 'react';
import { form_data, user_data, label_data, zalo_data } from "@/data/actions/get";
import { getCombinedData } from "../actions/customer.actions";
import checkAuthToken from "@/utils/checktoken";
import CustomerView from './index';
import { variant_data } from '../actions/variant.actions';
import { getRunningSchedulesAction } from '../actions/schedule.actions';

function PageSkeleton() {
    return <div>Đang tải trang...</div>;
}

export default async function Page({ searchParams }) {
    let c = await searchParams
    const [initialResult, userAuth, sources, label, zalo, users, variant, running] = await Promise.all([
        getCombinedData(c),
        checkAuthToken().then(auth => user_data({ _id: auth.id })),
        form_data(),
        label_data(),
        zalo_data(),
        user_data({}),
        variant_data(),
        getRunningSchedulesAction()
    ]);
    if (!userAuth[0].role.includes('Admin') && !userAuth[0].role.includes('Sale')) {
        return (
            <div className="flex items-center justify-center" style={{ height: '100%', width: '100%' }}>
                <h4 style={{ fontStyle: 'italic' }}>Bạn không có quyền truy cập trang này</h4>
            </div>
        )
    }
    const reversedLabel = [...label].reverse();

    return (
        <Suspense fallback={<PageSkeleton />}>
            <CustomerView
                initialResult={initialResult}
                user={userAuth}
                sources={sources}
                labelData={reversedLabel}
                formData={sources}
                zaloData={zalo}
                users={users}
                variant={variant}
                running={running.data}
                c={c}
            />
        </Suspense>
    );
}