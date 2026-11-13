import { student_data } from "@/data/actions/get";
import Profile from "./ui/profile";

export default async function OverviewTab({ params }) {
    const { id } = await params;
    const data = await student_data(id);
    if (!data) return null
    return (
        <Profile data={data} />
    );
}   
