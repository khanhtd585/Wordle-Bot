from collections import Counter
from time import sleep


XANH_LA = '🟩'
VANG = '🟨'
XAM = '⬛'

DANH_SACH_DAP_AN = []
DANH_SACH_TU_HOP_LE = []
ANSWER = 'aback'.upper()

def load_word_list(file_path: str) -> list[str]:
    with open(file_path, 'r') as f:
        words = [w.upper() for w in f.read().split(',')]
    return words

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


def loc_danh_sach(danh_sach_cu: list[str], tu_da_doan: str, mau_nhan_duoc: str) -> list[str]:
    """
    Lọc danh sách cũ, chỉ giữ lại những từ tương thích với mẫu màu đã nhận.
    """
    danh_sach_moi = []
    for tu in danh_sach_cu:
        print(tu, tu_da_doan, kiem_tra_mau(tu_da_doan, tu), mau_nhan_duoc)
        if kiem_tra_mau(tu_da_doan, tu) == mau_nhan_duoc:
            danh_sach_moi.append(tu)
    return danh_sach_moi

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

    for luot_doan in range(1, 7):
        print(f"\n--- Lượt đoán {luot_doan} ---")
        print(f"Số đáp án khả thi còn lại: {len(danh_sach_hien_tai)}")
        if len(danh_sach_hien_tai) <= 10:
            print(f"Các đáp án có thể là: {danh_sach_hien_tai}")

        # a. Tìm từ đoán tốt nhất
        tu_tot_nhat = danh_sach_hien_tai.pop()
        
        # b. Đưa ra gợi ý
        print(f"Từ gợi ý: '{tu_tot_nhat.upper()}'")
        
        # c. Nhận phản hồi từ người dùng
        mau_nhan_duoc = kiem_tra_mau(tu_tot_nhat, ANSWER)
        print(f"Kết quả: {mau_nhan_duoc}")

        # d. Kiểm tra chiến thắng
        if mau_nhan_duoc == XANH_LA * 5:
            print(f"\nChúc mừng! Bạn đã giải được câu đố sau {luot_doan} lần đoán!")
            return

        # e. Lọc danh sách cho lượt tiếp theo
        danh_sach_hien_tai = loc_danh_sach(danh_sach_hien_tai, tu_tot_nhat, mau_nhan_duoc)
        
        if not danh_sach_hien_tai:
            print("Lỗi: Không còn từ nào trong danh sách. Có thể bạn đã nhập sai mẫu màu hoặc từ không có trong danh sách.")
            return
        
        sleep(0.5)
        
        

    print("Rất tiếc, đã hết 6 lượt đoán.")

# Chạy chương trình
if __name__ == "__main__":
    DANH_SACH_DAP_AN = load_word_list('data.txt')
    DANH_SACH_TU_HOP_LE = DANH_SACH_DAP_AN.copy()
    giai_wordle()