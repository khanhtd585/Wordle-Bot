import math
from collections import Counter

# --- Bước 0: Chuẩn bị "Nguyên liệu" ---
# Ở đây tôi chỉ dùng một danh sách nhỏ để code chạy nhanh
# Trong thực tế, bạn cần tải file chứa hàng nghìn từ
DANH_SACH_DAP_AN = []
DANH_SACH_TU_HOP_LE =[]

# Định nghĩa các ký tự màu để dễ đọc
XANH_LA = '🟩'
VANG = '🟨'
XAM = '⬛'

ANSWER = 'ABACK'.upper()

def load_word_list(file_path: str) -> list[str]:
    with open(file_path, 'r') as f:
        words = [w.upper() for w in f.read().split(',')]
    return words

def check_guess_fake(guess: str, answer: str) -> list[dict]:
    res = []
    for i, c in enumerate(guess):
        ms = XAM
        if c == answer[i]:
            ms = XANH_LA
        elif c in answer:
            ms = VANG
        res.append(ms)
    return ''.join(res)

# --- Bước 1: Tạo "Cỗ máy Phản hồi" ---
def kiem_tra_mau(tu_doan: str, tu_dap_an: str) -> str:
    """
    So sánh một từ đoán với một từ đáp án để tạo ra chuỗi màu sắc.
    Ví dụ: kiem_tra_mau("crane", "cigar") -> "🟩⬛🟨⬛⬛"
    """
    if len(tu_doan) != 5 or len(tu_dap_an) != 5:
        return "Độ dài từ phải là 5"

    ket_qua = [''] * 5
    dem_chu_cai_dap_an = Counter(tu_dap_an)

    # Ưu tiên 1: Tìm các chữ cái đúng vị trí (XANH_LA)
    for i in range(5):
        if tu_doan[i] == tu_dap_an[i]:
            ket_qua[i] = XANH_LA
            dem_chu_cai_dap_an[tu_doan[i]] -= 1
    # Ưu tiên 2: Tìm các chữ cái sai vị trí (VANG) hoặc không có (XAM)
    for i in range(5):
        if ket_qua[i] == '': # Chỉ xét những chữ cái chưa được tô màu xanh
            if tu_doan[i] in dem_chu_cai_dap_an and dem_chu_cai_dap_an[tu_doan[i]] > 0:
                ket_qua[i] = VANG
                dem_chu_cai_dap_an[tu_doan[i]] -= 1
            else:
                ket_qua[i] = XAM

    return "".join(ket_qua)


# --- Bước 2: Tạo "Máy đo Thông tin" ---
def tinh_thong_tin_ky_vong(tu_doan: str, danh_sach_hien_tai: list[str]) -> float:
    """
    Tính lượng thông tin kỳ vọng (tính bằng bit) mà một từ đoán mang lại
    cho danh sách các đáp án hiện tại.
    """
    tong_so_tu = len(danh_sach_hien_tai)
    if tong_so_tu == 0:
        return 0.0

    # Phân nhóm các từ trong danh sách hiện tại dựa trên mẫu màu chúng tạo ra
    phan_phoi_mau = Counter()
    for tu_dap_an_tiem_nang in danh_sach_hien_tai:
        mau = kiem_tra_mau(tu_doan, tu_dap_an_tiem_nang)
        phan_phoi_mau[mau] += 1

    # Tính thông tin kỳ vọng dựa trên công thức entropy
    thong_tin_ky_vong = 0.0
    for so_luong in phan_phoi_mau.values():
        xac_suat = so_luong / tong_so_tu
        # Lượng thông tin của một kết quả là log2(1/p) = -log2(p)
        # Thông tin kỳ vọng là tổng của (xác suất * lượng thông tin)
        thong_tin_ky_vong += xac_suat * (-math.log2(xac_suat))

    return thong_tin_ky_vong


# --- Bước 3: Tạo "Bộ lọc" ---
def loc_danh_sach(danh_sach_cu: list[str], tu_da_doan: str, mau_nhan_duoc: str) -> list[str]:
    """
    Lọc danh sách cũ, chỉ giữ lại những từ tương thích với mẫu màu đã nhận.
    """
    danh_sach_moi = []
    for tu in danh_sach_cu:
        if kiem_tra_mau(tu_da_doan, tu) == mau_nhan_duoc:
            danh_sach_moi.append(tu)
    return danh_sach_moi


# --- Bước 4: Vòng lặp chính của Trò chơi ---
def giai_wordle():
    """
    Hàm chính để chạy thuật toán giải Wordle.
    """
    danh_sach_hien_tai = DANH_SACH_DAP_AN
    
    # *** LƯU Ý QUAN TRỌNG ***
    # Việc tính toán từ đầu tiên tốt nhất rất tốn thời gian.
    # Trong một chương trình thực tế, người ta sẽ tính trước và lưu lại kết quả
    # từ đầu tiên tốt nhất ("RAISE", "SOARE", "CRANE", v.v.)
    # Ở đây, chúng ta sẽ tính toán trực tiếp cho mỗi lượt.
    
    tu_tot_nhat = "AROSE"
    thong_tin_cao_nhat = -1.0

    for luot_doan in range(1, 7):
        print(f"\n--- Lượt đoán {luot_doan} ---")
        print(f"Số đáp án khả thi còn lại: {len(danh_sach_hien_tai)}")
        if len(danh_sach_hien_tai) <= 2:
            print(f"Các đáp án có thể là: {danh_sach_hien_tai}")
        
        # b. Đưa ra gợi ý
        print(f"Từ gợi ý: '{tu_tot_nhat.upper()}' (Điểm thông tin: {thong_tin_cao_nhat:.4f} bits)")
        
        # c. Nhận phản hồi từ người dùng
        mau_nhan_duoc = kiem_tra_mau(tu_tot_nhat, ANSWER)
        print(f"Mẫu màu nhận được: {mau_nhan_duoc}")

        # d. Kiểm tra chiến thắng
        if mau_nhan_duoc == XANH_LA * 5:
            print(f"\nChúc mừng! Bạn đã giải được câu đố sau {luot_doan} lần đoán!")
            return

        # e. Lọc danh sách cho lượt tiếp theo
        danh_sach_hien_tai = loc_danh_sach(danh_sach_hien_tai, tu_tot_nhat, mau_nhan_duoc)
        
        if not danh_sach_hien_tai:
            print("Lỗi: Không còn từ nào trong danh sách. Có thể bạn đã nhập sai mẫu màu hoặc từ không có trong danh sách.")
            return
        
         # a. Tìm từ đoán tốt nhất
        tu_tot_nhat = ""
        thong_tin_cao_nhat = -1.0

        # Duyệt qua tất cả các từ hợp lệ để tìm từ có thông tin kỳ vọng cao nhất
        for tu_doan_thu in danh_sach_hien_tai:
            diem_thong_tin = tinh_thong_tin_ky_vong(tu_doan_thu, danh_sach_hien_tai)
            if diem_thong_tin > thong_tin_cao_nhat:
                thong_tin_cao_nhat = diem_thong_tin
                tu_tot_nhat = tu_doan_thu

    print("Rất tiếc, đã hết 6 lượt đoán.")

# Chạy chương trình
if __name__ == "__main__":
    DANH_SACH_DAP_AN = load_word_list('data.txt')
    DANH_SACH_TU_HOP_LE = DANH_SACH_DAP_AN.copy()
    giai_wordle()