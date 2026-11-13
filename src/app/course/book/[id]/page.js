import BookDetail from "./ui/main";
import { book_data } from "@/data/actions/get";

export default async function Page({ params }) {
    const { id } = await params;
    let data = await book_data(id);
    if (!data) {
        return (
            <div>
                <h1>Không tìm thấy chương trình học.</h1>
            </div>
        );
    }

    return (
        <BookDetail data={data} id={id} />
    );
}