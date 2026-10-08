# -*- coding: utf-8 -*-
import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=80, bottom=80, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_borders(cell, color="000000", sz="4"):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for side in ['top', 'bottom', 'left', 'right']:
        node = OxmlElement(f'w:{side}')
        node.set(qn('w:val'), 'single')
        node.set(qn('w:sz'), str(sz))
        node.set(qn('w:space'), '0')
        node.set(qn('w:color'), color)
        tcBorders.append(node)
    tcPr.append(tcBorders)

# ==============================================================================
# MẪU 1: BÁO CÁO NỘI DUNG CẢI THIỆN (Theo phong cách Ảnh 1 - 4 Phân hệ nghiệp vụ)
# ==============================================================================
def create_report_style_1():
    doc = docx.Document()
    
    # Page Margins: Gọn gàng để vừa vặn 1 trang A4
    for section in doc.sections:
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Arial'
    style_normal.font.size = Pt(10.5)
    style_normal.font.color.rgb = RGBColor(0x11, 0x18, 0x27) # Dark #111827
    style_normal.paragraph_format.line_spacing = 1.18
    style_normal.paragraph_format.space_after = Pt(3)

    # Tiêu đề chính (Centered, Bold, ~18pt)
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(12)
    r_title = p_title.add_run("BÁO CÁO NỘI DUNG CẢI THIỆN")
    r_title.bold = True
    r_title.font.size = Pt(18)
    r_title.font.name = 'Arial'
    r_title.font.color.rgb = RGBColor(0x00, 0x00, 0x00)

    # Đề tài & Người thực hiện
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(14)
    p_sub.paragraph_format.line_spacing = 1.2
    
    r_dt_label = p_sub.add_run("Đề tài: ")
    r_dt_label.bold = True
    r_dt_val = p_sub.add_run("Nghiên cứu và phát triển nền tảng Quản trị Đào tạo & Tự động hóa Hồ sơ Năng lực Điện tử Học sinh (ePortfolio / Lookbook) đa môn học tích hợp AI cho Hệ thống Giáo dục STEAM.\n\n")
    
    r_author_label = p_sub.add_run("Người thực hiện: ")
    r_author_label.bold = True
    r_author_val = p_sub.add_run("Nguyễn Văn Cường")

    def add_h_style1(title_text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(4)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(title_text)
        r.bold = True
        r.font.size = Pt(12.5)
        r.font.name = 'Arial'
        r.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
        return h

    def add_bullet_style1(label, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.18
        r_lbl = p.add_run(label + ": ")
        r_lbl.bold = True
        r_lbl.font.name = 'Arial'
        r_txt = p.add_run(text)
        r_txt.font.name = 'Arial'
        return p

    # 1. Định hướng & Phạm vi Bài toán
    add_h_style1("1. Định hướng & Phạm vi Bài toán")
    add_bullet_style1(
        "Chuyển đổi bài toán mục tiêu",
        "Dịch chuyển phạm vi ứng dụng từ quản lý đào tạo đơn môn (Robotics cơ bản) sang nền tảng toàn diện phục vụ 3 khối môn trọng điểm: Robotics & STEM, Toán học & Tư duy logic, Tiếng Anh & Kỹ năng toàn cầu."
    )

    # 2. Quản lý Giao diện & Vận hành Đào tạo
    add_h_style1("2. Quản lý Giao diện & Vận hành Đào tạo")
    add_bullet_style1(
        "Hệ sinh thái Theme Engine (15 Templates)",
        "Triển khai Catalog 15 mẫu giao diện chia đều cho 3 môn học (Mecha Cyber, Chalkboard Genius, Cambridge Royal...). Thiết lập Design Tokens độc lập (màu chủ đạo, cardBg, dark/light mode) và tích hợp component TemplateSelector cho phép đổi theme theo từng lớp chỉ với 1 click."
    )
    add_bullet_style1(
        "Ấn phẩm Kỷ yếu ePortfolio Tạp chí A4 (Lookbook)",
        "Nâng cấp hồ sơ học sinh thành ấn phẩm Tạp chí cao cấp chuẩn in ấn A4 (210x297mm) gồm 7 trang: Bìa sang trọng, Thư ngỏ, Dòng thời gian, 2 Trang dự án, Radar kỹ năng 5 trục, Nhận xét AI và Chứng chỉ; hỗ trợ lật trang (flipbook) và xuất in PDF."
    )
    add_bullet_style1(
        "Chuẩn hóa thanh điều hướng & trang xem trước",
        "Tích hợp lối tắt 'Kho Template' (badge: 15 Mẫu) và 'Kỷ yếu Lookbook' (badge: A4) lên Sidebar Navigation; phát triển trang so sánh tương tác /preview-templates cho quản trị viên."
    )

    # 3. Ứng dụng AI & Tối ưu Luồng Vận hành (Smart Co-pilot)
    add_h_style1("3. Ứng dụng AI & Tối ưu Luồng Vận hành (Smart Co-pilot)")
    add_bullet_style1(
        "Quy trình đóng lớp Bán tự động (Review Sheet 30 giây)",
        "Đã lập trình hoàn thiện component ReviewSheetModal và tích hợp vào trang quản lý lớp học. Hệ thống tự động gom ảnh Drive, đề xuất 3 ảnh xuất sắc, gợi ý nhận xét AI và tính điểm radar kỹ năng; chỉ 1-click là lưu thẳng vào Profile học sinh và hoàn thành khóa học."
    )

    # 4. An toàn Thông tin & Kiến trúc Hệ thống
    add_h_style1("4. An toàn Thông tin & Kiến trúc Hệ thống")
    add_bullet_style1(
        "Kiến trúc Non-invasive & Tối ưu Backend",
        "Bổ sung trường Course.template vào schema Mongoose (0% ảnh hưởng các bảng khác). Tối ưu hóa truy vấn coursetry với Types.ObjectId.isValid và cơ chế fallback DEFAULT_TRIAL chống crash 500. Nâng cấp bộ seed data với mật khẩu mã hóa an toàn qua bcryptjs."
    )

    output_path = os.path.abspath("BAO_CAO_NOI_DUNG_CAI_THIEN_SYS_AIR_V1.docx")
    doc.save(output_path)
    print("Mau 1 saved to:", output_path)


# ==============================================================================
# MẪU 2: BÁO CÁO TIẾN ĐỘ TUẦN (Theo phong cách Ảnh 2 - Có bảng so sánh tiến độ)
# ==============================================================================
def create_report_style_2():
    doc = docx.Document()
    
    # Page Margins: Chuẩn 0.7 inch để vừa khít đẹp 1 trang A4
    for section in doc.sections:
        section.top_margin = Inches(0.65)
        section.bottom_margin = Inches(0.65)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Arial'
    style_normal.font.size = Pt(10)
    style_normal.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
    style_normal.paragraph_format.line_spacing = 1.15
    style_normal.paragraph_format.space_after = Pt(2.5)

    # Tiêu đề (Left-aligned, Bold, Uppercase như Ảnh 2)
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(8)
    r_title = p_title.add_run("BÁO CÁO TIẾN ĐỘ TUẦN: CẢI THIỆN\nNỘI DUNG DỰ ÁN HỆ THỐNG SYS-AIR V1")
    r_title.bold = True
    r_title.font.size = Pt(16)
    r_title.font.name = 'Arial'

    def add_h_style2(title_text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(8)
        h.paragraph_format.space_after = Pt(3)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(title_text)
        r.bold = True
        r.font.size = Pt(11.5)
        r.font.name = 'Arial'
        return h

    # 1. TỔNG QUAN TIẾN ĐỘ & MỤC TIÊU CẢI THIỆN
    add_h_style2("1. TỔNG QUAN TIẾN ĐỘ & MỤC TIÊU CẢI THIỆN")
    
    p1 = doc.add_paragraph()
    p1.add_run(
        "Tuần trước, hệ thống mới chỉ hỗ trợ quản lý học vụ cơ bản, giao diện đơn lẻ và hồ sơ học sinh dạng web tĩnh đơn điệu; "
        "việc thu thập ảnh hoạt động từ Google Drive vào Portfolio cuối khóa còn đứt gãy, buộc giáo viên phải chọn thủ công từng em rất tốn thời gian."
    )
    p2 = doc.add_paragraph()
    p2.add_run("Trong tuần này, dự án tập trung tạo bước đột phá qua việc hiện thực hóa 2 hướng phát triển mũi nhọn: ")
    r_m1 = p2.add_run("Theme Engine Đa nhiệm (15 Mẫu Giao diện)")
    r_m1.bold = True
    p2.add_run(" và ")
    r_m2 = p2.add_run("Kỷ yếu ePortfolio Tạp chí Khổ in A4")
    r_m2.bold = True
    p2.add_run(", đồng thời hoàn thiện giải pháp ")
    r_m3 = p2.add_run("Bán tự động (Smart Co-pilot)")
    r_m3.bold = True
    p2.add_run(" giúp tiết kiệm 90% thời gian đóng khóa học.")

    # 2. BẢNG SO SÁNH TIẾN ĐỘ: TUẦN NÀY SO VỚI TUẦN TRƯỚC
    add_h_style2("2. BẢNG SO SÁNH TIẾN ĐỘ: TUẦN NÀY SO VỚI TUẦN TRƯỚC")
    
    table_rows = [
        (
            "Kiến trúc &\nGiao diện Theme",
            "Chỉ có 1 giao diện mặc định; không phân hóa được tính chất từng môn học.",
            "Phát triển hệ sinh thái 15 templates chia theo 3 môn (Robot, Toán, Tiếng Anh) với Design Tokens độc lập; đổi theme theo lớp chỉ 1 click."
        ),
        (
            "Hồ sơ Năng lực\n(ePortfolio)",
            "Dạng web tĩnh cơ bản, thiếu tính thẩm mỹ, không có định dạng in ấn gửi phụ huynh.",
            "Ra mắt Kỷ yếu Tạp chí Lookbook A4 7 trang (/portfolio-lookbook), hỗ trợ xem lật trang (flipbook), radar kỹ năng và xuất bản in PDF."
        ),
        (
            "Luồng Vận hành &\nDữ liệu Cuối khóa",
            "GV mất hàng giờ chọn ảnh thủ công từ Drive; dữ liệu hay bị bỏ trống khi kết thúc khóa.",
            "Lập trình hoàn thiện ReviewSheetModal (Bảng duyệt nhanh 30s) và nâng cấp API PATCH lưu tự động ảnh, nhận xét, radar kỹ năng vào Profile học sinh."
        ),
        (
            "Cơ sở dữ liệu &\nĐộ ổn định Backend",
            "Model Course chưa lưu theme; truy vấn coursetry dễ crash 500 do thiếu ID hoặc dữ liệu rỗng.",
            "Bổ sung trường Course.template; tối ưu an toàn với Types.ObjectId.isValid & fallback DEFAULT_TRIAL; bảo mật seed data với bcryptjs."
        )
    ]

    table = doc.add_table(rows=len(table_rows) + 1, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    col_widths = [Inches(1.5), Inches(2.5), Inches(2.8)]
    for row in table.rows:
        for i, w in enumerate(col_widths):
            row.cells[i].width = w

    # Header row
    hdr_cells = table.rows[0].cells
    hdr_titles = ["Hạng mục", "Hiện trạng tuần trước", "Cải thiện đạt được tuần này"]
    for i, title in enumerate(hdr_titles):
        set_cell_margins(hdr_cells[i], top=70, bottom=70, left=90, right=90)
        set_cell_borders(hdr_cells[i], color="000000", sz="4")
        hdr_cells[i].vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(title)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.name = 'Arial'

    # Body rows
    for row_idx, data in enumerate(table_rows):
        row_cells = table.rows[row_idx + 1].cells
        for col_idx in range(3):
            cell = row_cells[col_idx]
            set_cell_margins(cell, top=60, bottom=60, left=90, right=90)
            set_cell_borders(cell, color="000000", sz="4")
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.12
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(data[col_idx])
            r.font.size = Pt(9)
            r.font.name = 'Arial'
            if col_idx == 0:
                r.bold = True

    # 3. KẾT QUẢ ĐẠT ĐƯỢC & VẤN ĐỀ TỒN TẠI
    add_h_style2("3. KẾT QUẢ ĐẠT ĐƯỢC & VẤN ĐỀ TỒN TẠI")
    
    p_res1 = doc.add_paragraph(style='List Bullet')
    p_res1.paragraph_format.space_before = Pt(1.5)
    p_res1.paragraph_format.space_after = Pt(2)
    r_res1_b = p_res1.add_run("Điểm đạt được: ")
    r_res1_b.bold = True
    p_res1.add_run("Hoàn thiện trọn vẹn chu trình Smart Co-pilot từ giao diện Review Sheet 30s, tự động gom ảnh Drive, tính radar kỹ năng cho tới Kỷ yếu Lookbook A4; build pass 100% không lỗi.")

    p_res2 = doc.add_paragraph(style='List Bullet')
    p_res2.paragraph_format.space_before = Pt(1.5)
    p_res2.paragraph_format.space_after = Pt(2)
    r_res2_b = p_res2.add_run("Hạn chế còn tồn đọng: ")
    r_res2_b.bold = True
    p_res2.add_run("Cần tích hợp thêm webhook tự động thông báo đường link Kỷ yếu Lookbook đến Zalo của phụ huynh khi khóa học hoàn thành.")

    # 4. KẾ HOẠCH TUẦN KẾ TIẾP
    add_h_style2("4. KẾ HOẠCH TUẦN KẾ TIẾP")
    
    p_plan1 = doc.add_paragraph()
    p_plan1.paragraph_format.left_indent = Inches(0.2)
    p_plan1.paragraph_format.space_before = Pt(1.5)
    p_plan1.paragraph_format.space_after = Pt(2)
    r_num1 = p_plan1.add_run("1.  ")
    r_num1.bold = True
    p_plan1.add_run("Tích hợp webhook tự động gửi đường link Kỷ yếu Lookbook A4 đến Zalo của phụ huynh khi khóa học hoàn thành.")

    p_plan2 = doc.add_paragraph()
    p_plan2.paragraph_format.left_indent = Inches(0.2)
    p_plan2.paragraph_format.space_before = Pt(1.5)
    p_plan2.paragraph_format.space_after = Pt(2)
    r_num2 = p_plan2.add_run("2.  ")
    r_num2.bold = True
    p_plan2.add_run("Triển khai thử nghiệm thực tế trên 5 lớp học sắp bế giảng để ghi nhận phản hồi và đánh giá từ giáo viên bộ môn.")

    # Ghi đè vào BAO_CAO_TIEN_DO_TUAN_SYS_AIR_V1.docx
    output_path = os.path.abspath("BAO_CAO_TIEN_DO_TUAN_SYS_AIR_V1.docx")
    doc.save(output_path)
    print("Mau 2 saved to:", output_path)

if __name__ == '__main__':
    create_report_style_1()
    create_report_style_2()
