# -*- coding: utf-8 -*-
import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_borders(cell, top=None, bottom=None, left=None, right=None):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    borders = {'top': top, 'bottom': bottom, 'left': left, 'right': right}
    for b_name, b_val in borders.items():
        if b_val:
            node = OxmlElement(f'w:{b_name}')
            node.set(qn('w:val'), b_val.get('val', 'single'))
            node.set(qn('w:sz'), str(b_val.get('sz', 4)))
            node.set(qn('w:space'), '0')
            node.set(qn('w:color'), b_val.get('color', 'CCCCCC'))
            tcBorders.append(node)
        else:
            node = OxmlElement(f'w:{b_name}')
            node.set(qn('w:val'), 'none')
            tcBorders.append(node)
    tcPr.append(tcBorders)

def add_callout(doc, text_prefix, text_content):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(6.5)
    
    cell = table.cell(0, 0)
    set_cell_background(cell, "EFF6FF")
    set_cell_margins(cell, top=120, bottom=120, left=180, right=150)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    
    left_node = OxmlElement('w:left')
    left_node.set(qn('w:val'), 'single')
    left_node.set(qn('w:sz'), '24') # 3pt
    left_node.set(qn('w:space'), '0')
    left_node.set(qn('w:color'), '2563EB')
    tcBorders.append(left_node)
    
    for side in ['top', 'bottom', 'right']:
        node = OxmlElement(f'w:{side}')
        node.set(qn('w:val'), 'none')
        tcBorders.append(node)
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.2
    
    r_prefix = p.add_run(text_prefix + " ")
    r_prefix.bold = True
    r_prefix.font.color.rgb = RGBColor(0x1D, 0x4E, 0xD8)
    r_prefix.font.name = 'Calibri'
    r_prefix.font.size = Pt(10.5)
    
    r_text = p.add_run(text_content)
    r_text.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    r_text.font.name = 'Calibri'
    r_text.font.size = Pt(10.5)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(2)

def build_report():
    doc = docx.Document()
    
    # Page setup: Margins 1 inch (2.54 cm)
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)
    
    # Styles
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    style_normal.paragraph_format.line_spacing = 1.2
    style_normal.paragraph_format.space_after = Pt(4)
    
    # Colors
    NAVY = RGBColor(0x0F, 0x17, 0x2A)       # #0F172A
    BLUE_TITLE = RGBColor(0x1E, 0x3A, 0x8A) # #1E3A8A
    BLUE_SEC = RGBColor(0x25, 0x63, 0xEB)   # #2563EB
    GRAY_SUB = RGBColor(0x47, 0x55, 0x69)   # #475569
    DARK = RGBColor(0x0F, 0x17, 0x2A)
    
    # ==========================================
    # HEADER / TITLE
    # ==========================================
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(6)
    
    r_title = p_title.add_run("BÁO CÁO TIẾN ĐỘ TUẦN: CẢI THIỆN NỘI DUNG DỰ ÁN\nHỆ THỐNG SYS-AIR V1")
    r_title.bold = True
    r_title.font.size = Pt(17)
    r_title.font.color.rgb = BLUE_TITLE
    r_title.font.name = 'Calibri'
    
    # Meta Box / Info
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(10)
    p_meta.paragraph_format.line_spacing = 1.25
    
    def add_meta_line(p, label, value):
        r1 = p.add_run(f"{label}: ")
        r1.bold = True
        r1.font.size = Pt(10.5)
        r1.font.color.rgb = DARK
        r2 = p.add_run(f"{value}\n")
        r2.font.size = Pt(10.5)
        r2.font.color.rgb = GRAY_SUB
        
    add_meta_line(p_meta, "Đề tài", "Nghiên cứu & phát triển nền tảng Quản trị Đào tạo & Tự động hóa Hồ sơ Năng lực (ePortfolio / Lookbook Tạp chí) đa môn học tích hợp AI")
    add_meta_line(p_meta, "Người thực hiện", "Nguyễn Văn Cường (Kỹ sư phụ trách dự án)")
    add_meta_line(p_meta, "Thời gian báo cáo", "Tuần làm việc vừa qua • Tháng 09/2026")
    add_meta_line(p_meta, "Phạm vi công nghệ", "Hệ thống Sys-Air v1 (Next.js App Router, MongoDB Mongoose, Tailwind CSS, Python)")

    # Divider line
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_after = Pt(10)
    p_div_border = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="1" w:color="2563EB"/></w:pBdr>')
    p_div._p.get_or_add_pPr().append(p_div_border)

    # Helper for Headings
    def add_h1(title_text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(6)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(title_text)
        r.bold = True
        r.font.size = Pt(13.5)
        r.font.color.rgb = BLUE_TITLE
        r.font.name = 'Calibri'
        return h

    def add_h2(title_text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(4)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(title_text)
        r.bold = True
        r.font.size = Pt(11.5)
        r.font.color.rgb = BLUE_SEC
        r.font.name = 'Calibri'
        return h

    def add_bullet(text_bold, text_normal):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.2
        r_b = p.add_run(text_bold)
        r_b.bold = True
        r_b.font.color.rgb = DARK
        r_n = p.add_run(" " + text_normal)
        r_n.font.color.rgb = DARK
        return p

    # ==========================================
    # 1. TỔNG QUAN TIẾN ĐỘ & MỤC TIÊU CẢI THIỆN
    # ==========================================
    add_h1("1. TỔNG QUAN TIẾN ĐỘ & MỤC TIÊU CẢI THIỆN")
    
    p_ov1 = doc.add_paragraph()
    p_ov1.add_run(
        "Trong tuần vừa qua, dự án SYS-AIR V1 đã tạo ra bước đột phá quan trọng: dịch chuyển từ một hệ thống quản lý học vụ và "
        "điểm danh lớp học đơn thuần sang "
    )
    r_bold_ov = p_ov1.add_run("Nền tảng Quản trị Đào tạo & ePortfolio Đa Môn học Chuyên Nghiệp")
    r_bold_ov.bold = True
    p_ov1.add_run(
        ", đồng thời ứng dụng công nghệ AI để giải quyết triệt để bài toán bàn giao hồ sơ học tập chất lượng cao cho phụ huynh. "
        "Mục tiêu trọng tâm của tuần tập trung vào 3 mũi nhọn phát triển cốt lõi:"
    )
    
    add_bullet(
        "Theme Engine Đa Môn Học (Catalog 15 Mẫu):",
        "Xây dựng hệ sinh thái giao diện chuyên sâu phân theo 3 bộ môn (Robotics & STEM, Toán học & Tư duy, Tiếng Anh & Kỹ năng) "
        "với hệ thống Design Tokens độc lập, cho phép đổi theme theo lớp chỉ với 1 click."
    )
    add_bullet(
        "Ấn phẩm Kỷ yếu ePortfolio Tạp chí Khổ A4 (Portfolio Lookbook):",
        "Chuyển đổi hình thức thể hiện hồ sơ học sinh từ trang web phẳng sang ấn phẩm Tạp chí cao cấp chuẩn in ấn A4 (210mm x 297mm), "
        "hỗ trợ lật trang (flipbook), biểu đồ radar năng lực và xuất bản file in/PDF gửi phụ huynh."
    )
    add_bullet(
        "Chuẩn hóa Nghiệp vụ & Đề xuất Luồng Dữ liệu Bán Tự Động (Smart Co-pilot):",
        "Hoàn thiện tài liệu đặc tả nghiệp vụ DE_XUAT_TOI_UU_LUONG_PORTFOLIO.docx cùng 11 slide thuyết trình; "
        "đề xuất cơ chế hệ thống chuẩn bị sẵn 90% (ảnh Drive + nhận xét AI + điểm kỹ năng), giáo viên chỉ duyệt 30 giây."
    )

    # ==========================================
    # 2. BẢNG SO SÁNH TIẾN ĐỘ
    # ==========================================
    add_h1("2. BẢNG SO SÁNH TIẾN ĐỘ: TUẦN NÀY SO VỚI TUẦN TRƯỚC")
    
    table_data = [
        (
            "Giao diện & Chủ đề\n(Theme Engine)",
            "Chỉ có 1 giao diện mặc định, màu sắc đơn điệu, không thể hiện được tính chất đặc thù của từng môn học.",
            "Hoàn thiện 15 mẫu giao diện chuyên sâu chia theo 3 nhóm môn (Robot, Toán, Tiếng Anh); thiết lập Design Tokens độc lập; tích hợp bộ chọn theme trực tiếp trên từng lớp qua API."
        ),
        (
            "Hồ sơ Năng lực\n(ePortfolio / Lookbook)",
            "Portfolio hiển thị dạng danh sách web đơn giản, thiếu tính thẩm mỹ cao cấp, không có định dạng in ấn bàn giao cho phụ huynh.",
            "Ra mắt Kỷ yếu Tạp chí Khổ in A4 7 trang (/portfolio-lookbook): Bìa sang trọng, Thư ngỏ, Dòng thời gian, 2 Trang dự án, Radar kỹ năng, Nhận xét AI và Chứng nhận tốt nghiệp; hỗ trợ xem Flipbook & Print A4."
        ),
        (
            "Trải nghiệm Quản trị\n(UX & Navigation)",
            "Thanh menu thiếu lối tắt; người quản trị không có công cụ trực quan để so sánh và chọn mẫu thiết kế cho lớp học.",
            "Bổ sung 2 lối tắt trên Sidebar Navigation kèm Badge nổi bật (Kho Template: 15 Mẫu, Kỷ yếu Lookbook: A4); xây dựng trang so sánh tương tác /preview-templates."
        ),
        (
            "Luồng Vận hành &\nDữ liệu Cuối khóa",
            "Dữ liệu ảnh Google Drive bị đứt gãy; GV mất hàng chục thao tác thủ công mở từng học sinh để gán ảnh; nhiều em bị bỏ trống ảnh khi đóng khóa.",
            "Hoàn thiện tài liệu Đặc tả nghiệp vụ & Đề xuất luồng Smart Co-pilot (DE_XUAT_TOI_UU_LUONG_PORTFOLIO.docx) kèm 11 Slide thuyết trình; hệ thống soạn sẵn 90%, GV chỉ mất 30s duyệt nhanh cả lớp."
        ),
        (
            "Cơ sở dữ liệu &\nTính ổn định (Backend)",
            "Model Course chưa lưu định dạng theme; các hàm truy vấn coursetry dễ crash 500 nếu thiếu dữ liệu phòng hoặc ID không chuẩn.",
            "Mở rộng schema Course.template; phòng vệ an toàn với Types.ObjectId.isValid và fallback DEFAULT_TRIAL; nâng cấp seed data với mật khẩu mã hóa an toàn bcryptjs."
        )
    ]
    
    table = doc.add_table(rows=len(table_data) + 1, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    col_widths = [Inches(1.5), Inches(2.5), Inches(2.7)]
    for row in table.rows:
        for i, w in enumerate(col_widths):
            row.cells[i].width = w
            
    # Format Header Row
    hdr_cells = table.rows[0].cells
    hdr_titles = ["Hạng mục", "Hiện trạng tuần trước", "Cải thiện đạt được tuần này"]
    for i, title in enumerate(hdr_titles):
        set_cell_background(hdr_cells[i], "1E3A8A")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=120, right=120)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        r.bold = True
        r.font.size = Pt(10.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        r.font.name = 'Calibri'
        
    border_spec = {'val': 'single', 'sz': 4, 'color': 'D1D5DB'}
    
    # Format Body Rows
    for row_idx, data in enumerate(table_data):
        row_cells = table.rows[row_idx + 1].cells
        bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx in range(3):
            cell = row_cells[col_idx]
            set_cell_background(cell, bg_color)
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            set_cell_borders(cell, top=border_spec, bottom=border_spec, left=border_spec, right=border_spec)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            if col_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                r = p.add_run(data[col_idx])
                r.bold = True
                r.font.size = Pt(10)
                r.font.color.rgb = BLUE_TITLE
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                r = p.add_run(data[col_idx])
                r.font.size = Pt(9.5)
                r.font.color.rgb = DARK
                
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ==========================================
    # 3. CHI TIẾT NỘI DUNG CẢI THIỆN THEO PHÂN HỆ
    # ==========================================
    add_h1("3. CHI TIẾT NỘI DUNG CẢI THIỆN THEO PHÂN HỆ")

    # 3.1
    add_h2("3.1. Định hướng & Phạm vi Bài toán Đa Môn học")
    doc.add_paragraph(
        "Hệ thống đã chính thức thoát khỏi giới hạn của một ứng dụng đào tạo đơn môn (chỉ phục vụ các lớp lắp ráp kỹ thuật), "
        "để mở rộng thành giải pháp quản lý & ePortfolio cho 3 bộ môn trọng điểm trong giáo dục phổ thông hiện đại:"
    )
    add_bullet("Khối Robotics & STEM:", "Tập trung thể hiện mạch vi điều khiển, cơ cấu cơ khí động học, cảm biến siêu âm, sa bàn đối kháng và giải pháp kỹ thuật số.")
    add_bullet("Khối Toán học & Tư duy:", "Nhấn mạnh các định lý hình học không gian, giải thuật mật mã, biểu đồ tọa độ, sơ đồ tư duy (mindmap) và phương pháp tư duy giải quyết vấn đề.")
    add_bullet("Khối Tiếng Anh & Kỹ năng Thế kỷ 21:", "Tập trung phản ánh năng lực giao tiếp toàn cầu, dự án thuyết trình video, tranh biện (debate) và các chứng chỉ chuẩn quốc tế.")

    # 3.2
    add_h2("3.2. Hệ thống Theme Engine & Quản trị Giao diện Đào tạo (15 Templates)")
    doc.add_paragraph(
        "Nhằm mang đến trải nghiệm thị giác ấn tượng nhất cho phụ huynh và học sinh, tuần qua đã hoàn thành kiến trúc Theme Engine "
        "trong file mã nguồn src/lib/templates/index.js, gồm đầy đủ 15 templates được thiết kế chuyên biệt:"
    )
    add_bullet("5 Template Robotics:", "Mecha Cyber (chiến binh vi mạch), Galactic Odyssey (du hành vũ trụ tím huyền ảo), Blueprint Lab (bản vẽ kỹ thuật xanh dương), Retro Arcade (game 8-bit hoài niệm), Eco-Tech Green (công nghệ xanh).")
    add_bullet("5 Template Toán học:", "Chalkboard Genius (bảng đen phấn vàng kinh điển), Geometric Shapes (đa giác origami 3D), Space Coordinate (hệ trục tọa độ không gian), Detective Mystery (thám tử mật mã tư duy), Clean Calculus (học thuật tinh tế chuẩn quốc tế).")
    add_bullet("5 Template Tiếng Anh:", "Cambridge Royal (hoàng gia Oxford sang trọng), Explorer Globe (nhà thám hiểm địa cầu), Creative Workshop (xưởng sáng tạo nghệ thuật), Storybook Pastel (câu chuyện tranh đồng thoại), Future Leader (nhà lãnh đạo tương lai).")
    add_bullet("Cấu trúc Design Tokens Độc Lập:", "Mỗi template định nghĩa chuẩn các biến giao diện: themeMode (dark/light), cardBg, cardBorder, headerBg, primary, accent, progressBar gradient, badgeBg, lessonBg. Giao diện trang cá nhân học sinh tự động đổi màu sắc đồng bộ.")
    add_bullet("Component TemplateSelector tương tác:", "Tích hợp trực tiếp vào trang chi tiết khóa học. Giáo viên có thể xem trước bảng màu mẫu, hệ thống tự nhận diện môn học qua tên giáo trình (Book) và gửi API PATCH /api/course/[id] để lưu template ngay tức thì.")

    # 3.3
    add_h2("3.3. Ứng dụng AI & Ấn phẩm Kỷ yếu Tạp chí Khổ in A4 (Portfolio Lookbook)")
    doc.add_paragraph(
        "Điểm nhấn công nghệ vượt bậc trong tuần là trang Kỷ yếu Tạp chí Lookbook tại đường dẫn /portfolio-lookbook. "
        "Hồ sơ năng lực học sinh được chuyển hóa thành ấn phẩm Tạp chí cao cấp chuẩn quốc tế khổ in A4 (210mm x 297mm):"
    )
    add_bullet("Cấu trúc 7 Trang Nội dung Chuẩn Mực:", "Trang 1: Bìa tạp chí ấn tượng; Trang 2: Thư ngỏ ban giám đốc & triết lý đào tạo; Trang 3: Timeline hành trình trưởng thành qua từng tuần; Trang 4: Showcase 2 đồ án xuất sắc; Trang 5: Dự án Capstone & Biểu đồ Radar kỹ năng 5 trục; Trang 6: Đánh giá chuyên sâu kết hợp giữa Giáo viên & AI Co-pilot; Trang 7: Lễ tốt nghiệp & Bìa sau.")
    add_bullet("Dữ liệu Demo 3 Học sinh Đại diện:", "Tích hợp sẵn hồ sơ đa dạng cho Nguyễn Văn An (Robotics 11 tuổi), Lê Phương Anh (Toán tư duy 12 tuổi) và Trần Minh Khang (Tiếng Anh 10 tuổi) với hình ảnh và chỉ số chi tiết.")
    add_bullet("Bộ điều khiển Lookbook tiện ích:", "Hỗ trợ đổi học sinh, đổi phong cách theme tức thì, chuyển chế độ xem (Trang đơn / Trang đôi Flipbook) và đặc biệt là chế độ Print/Export PDF chuyên nghiệp sẵn sàng in ấn gửi phụ huynh vào ngày bế giảng.")

    # 3.4
    add_h2("3.4. Đề xuất Tối ưu Luồng Dữ liệu Bán Tự Động (Smart Co-pilot Workflow)")
    doc.add_paragraph(
        "Để giải quyết triệt để vấn đề 'dữ liệu hình ảnh bị bỏ rơi' và gánh nặng nhập liệu của giáo viên, "
        "tuần qua đã hoàn thành văn bản Đặc tả nghiệp vụ DE_XUAT_TOI_UU_LUONG_PORTFOLIO.docx cùng 11 slide thuyết trình chuyên nghiệp:"
    )
    add_callout(
        doc,
        "💡 NGUYÊN TẮC CỐT LÕI:",
        "Hệ thống tự động chuẩn bị sẵn 90% (AI đọc nhận xét để tính điểm kỹ năng + tự động gắp ảnh tiêu biểu từ Google Drive), "
        "giáo viên chỉ cần dành 30 giây lướt qua một bảng Duyệt Nhanh (Review Sheet) trước khi xuất bản đồng loạt toàn bộ lớp học."
    )
    add_bullet("Khắc phục 3 điểm nghẽn lớn:", "Xóa bỏ tình trạng đứt gãy giữa Drive và Portfolio; tiết kiệm 90% thời gian đóng lớp cho giáo viên; biến chỉ số radar từ mức cố định 50% thành dữ liệu phản ánh thực tế sự tiến bộ của học sinh.")
    add_bullet("Kiến trúc Non-invasive (An toàn 100%):", "Cam kết 0% thay đổi cấu trúc bảng cơ sở dữ liệu cũ, tận dụng chính xác các trường sẵn có trong Student.Profile.Present, không can thiệp vào các phân hệ lõi: Điểm danh, Lịch học, Học phí, SLA, CRM.")

    # 3.5
    add_h2("3.5. Kiến trúc Kỹ thuật, Tối ưu CSDL & Phòng vệ Hệ thống")
    add_bullet("Mở rộng Model Course:", "Bổ sung trường template: { type: String, default: 'robot-mecha' } vào Schema Mongoose để lưu trữ và truy xuất chủ đề giao diện.")
    add_bullet("Tối ưu hóa Truy vấn Lớp học thử (coursetry.js):", "Khắc phục triệt để lỗi sập trang khi dữ liệu phòng học hoặc học sinh thử nghiệm rỗng bằng Types.ObjectId.isValid, đồng thời bổ sung cấu trúc fallback DEFAULT_TRIAL an toàn.")
    add_bullet("Nâng cấp Bảo mật Seeding Dữ liệu:", "Cập nhật /api/test/seed/route.js và kịch bản seed_full_data.js với thuật toán băm mật khẩu bcryptjs, tự động khởi tạo các tài khoản Admin (admin@test.com) và Giáo viên (gvtest@test.com) phục vụ kiểm thử phân quyền.")
    add_bullet("Phòng vệ Component UI:", "Sửa đổi CourseItem, CourseTryItem, Banner, Profile để loại bỏ hoàn toàn các ngoại lệ TypeError: Cannot read properties of undefined.")

    # ==========================================
    # 4. KẾT QUẢ ĐẠT ĐƯỢC & VẤN ĐỀ TỒN TẠI
    # ==========================================
    add_h1("4. KẾT QUẢ ĐẠT ĐƯỢC & VẤN ĐỀ TỒN TẠI")
    
    add_h2("4.1. Điểm đạt được nổi bật")
    add_bullet("Giá trị thẩm mỹ & Thương hiệu đột phá:", "Hệ thống sở hữu bộ giao diện 15 mẫu đa môn và ấn phẩm Kỷ yếu Lookbook A4 đạt chuẩn thiết kế hiện đại, tạo ấn tượng mạnh mẽ cho phụ huynh ngay từ cái nhìn đầu tiên.")
    add_bullet("Linh hoạt & Dễ mở rộng:", "Kiến trúc Design Tokens cho phép bổ sung thêm môn học mới (Lập trình Game, AI, Nghệ thuật số) trong tương lai chỉ bằng việc khai báo token mà không phải viết lại code CSS.")
    add_bullet("Độ tin cậy và Ổn định cao:", "Triệt tiêu các lỗi crash trang do dữ liệu rỗng; cơ sở dữ liệu có sẵn dữ liệu seed hoàn chỉnh để demo và kiểm thử thông suốt.")
    add_bullet("Cơ sở lý luận & Đề xuất hoàn chỉnh:", "Đã có sẵn tài liệu đề xuất giải pháp kỹ thuật, bảng so sánh phương án và bộ 11 slide để trình bày trực tiếp với Ban Lãnh đạo.")

    add_h2("4.2. Hạn chế còn tồn đọng")
    add_bullet("Giao diện Review Sheet Modal:", "Giao diện bảng duyệt ảnh tập trung khi bấm 'Xác nhận hoàn thành khóa học' hiện mới dừng ở bản đặc tả thiết kế, cần lập trình component thực tế trong tuần tới.")
    add_bullet("Tự động trích xuất Google Drive:", "Cần xây dựng service đồng bộ để tự động bốc ảnh có gắn sao (Starred/Ghim) từ Google Drive lớp học vào các ô dự án của Portfolio.")

    # ==========================================
    # 5. KẾ HOẠCH HÀNH ĐỘNG TUẦN KẾ TIẾP
    # ==========================================
    add_h1("5. KẾ HOẠCH HÀNH ĐỘNG TUẦN KẾ TIẾP")
    
    add_bullet("1. Lập trình Giao diện Review Sheet Modal (Bảng Duyệt Nhanh 30 Giây):", "Xây dựng popup hiển thị danh sách cả lớp với ảnh đề xuất và nhận xét AI khi giáo viên gạt nút hoàn thành khóa học trên trang chi tiết lớp.")
    add_bullet("2. Tích hợp API Lọc Ảnh Google Drive:", "Hiện thực hóa logic quét thư mục ảnh buổi học trên Google Drive để tự động điền vào 3 ô sản phẩm của học sinh.")
    add_bullet("3. Tích hợp AI Engine Tính Điểm Radar Kỹ Năng:", "Kết nối luồng AI phân tích nhận xét buổi học (CmtFn) để tự động sinh điểm số cho 5 trục kỹ năng cá nhân.")
    add_bullet("4. Tổ chức Họp Đánh Giá & Demo Nội Bộ:", "Trình bày tài liệu đề xuất và demo ấn phẩm Kỷ yếu A4 với Quản lý Đào tạo và Đội ngũ Giáo viên để tiếp thu ý kiến hoàn thiện.")

    # Footer note
    p_foot = doc.add_paragraph()
    p_foot.paragraph_format.space_before = Pt(16)
    p_foot.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_sign = p_foot.add_run("Báo cáo được lập ngày 16/09/2026\nKỹ sư phụ trách: Nguyễn Văn Cường")
    r_sign.italic = True
    r_sign.font.size = Pt(10)
    r_sign.font.color.rgb = GRAY_SUB

    output_path = os.path.abspath("BAO_CAO_TIEN_DO_TUAN_SYS_AIR_V1.docx")
    doc.save(output_path)
    print("SUCCESS: File generated at:", output_path)

if __name__ == '__main__':
    build_report()
