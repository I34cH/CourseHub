"""
CourseHub - Buoi 1: On tap Python va mo phong he thong quan ly hoc phan
Mon hoc: Co so du lieu Web va he thong thong tin
Giang vien: TS. Vu Tien Dung - Pham Duy Phuong
"""

print("CourseHub - Buoi 1")

# 1. Mo phong du lieu bang list va dictionary
students = [
    {"id": "22000001", "name": "Nguyen Minh Anh", "major": "KHDL"},
    {"id": "22000002", "name": "Tran Duc Long", "major": "KHDL"},
]

courses = [
    {
        "code": "INT2204",
        "name": "Co so du lieu Web va he thong thong tin",
        "capacity": 3,
        "enrolled": 2,
    },
    {
        "code": "INT2205",
        "name": "Khai pha du lieu",
        "capacity": 2,
        "enrolled": 2,
    },
]

enrollments = [
    {"student_id": "22000001", "course_code": "INT2204"}
]

# 2. Duyet du lieu va tinh so cho con lai
print("\n--- Danh sach hoc phan va so cho con lai ---")
for course in courses:
    remaining = course["capacity"] - course["enrolled"]
    print(f"{course['code']} - con {remaining} cho")


# 3. Cac ham tra cuu du lieu
def find_course(course_code):
    """Tim kiem hoc phan theo ma hoc phan."""
    for course in courses:
        if course["code"] == course_code:
            return course
    return None


def find_student(student_id):
    """Tim kiem sinh vien theo ma sinh vien."""
    for student in students:
        if student["id"] == student_id:
            return student
    return None


def search_courses(keyword):
    """
    Tim kiem hoc phan theo ca ma va ten, khong phan biet hoa thuong,
    loai bo khoang trang thua o hai dau tu khoa.
    """
    normalized = keyword.strip().lower()
    results = []
    for course in courses:
        code = course["code"].lower()
        name = course["name"].lower()
        if normalized in code or normalized in name:
            results.append(course)
    return results


# 4. Kiem tra quy tac dang ky hoc phan
def can_enroll(student_id, course_code):
    """
    Kiem tra cac quy tac dang ky:
    - Sinh vien phai ton tai
    - Hoc phan phai ton tai
    - Sinh vien chua dang ky trung hoc phan nay
    - Lop hoc phan con cho trong
    """
    student = find_student(student_id)
    if student is None:
        return False, "Sinh vien khong ton tai"

    course = find_course(course_code)
    if course is None:
        return False, "Hoc phan khong ton tai"

    duplicated = any(
        item["student_id"] == student_id and item["course_code"] == course_code
        for item in enrollments
    )
    if duplicated:
        return False, "Sinh vien da dang ky hoc phan nay"

    if course["enrolled"] >= course["capacity"]:
        return False, "Lop da du so luong"

    return True, "Co the dang ky"


# 5. Ham dang ky hoc phan (Bai tap tu luyen muc VII.1)
def enroll_student(student_id, course_code):
    """
    Dang ky hoc phan cho sinh vien:
    - Kiem tra tinh hop le bang can_enroll()
    - Neu hop le: them ban ghi moi vao enrollments va tang so luong enrolled cua hoc phan len 1.
    """
    eligible, message = can_enroll(student_id, course_code)
    if not eligible:
        return False, message

    course = find_course(course_code)
    enrollments.append({"student_id": student_id, "course_code": course_code})
    course["enrolled"] += 1
    return True, "Dang ky thanh cong"


# 6. Minh hoa xu ly ngoai le khi nguoi dung nhap lieu
print("\n--- Thu nghiem xu ly ngoai le (try/except) ---")
try:
    limit_input = input("Nhap so luong hoc phan muon hien thi (nhan Enter de bo qua): ").strip()
    if limit_input:
        limit = int(limit_input)
        print("Ket qua hien thi:", courses[:limit])
    else:
        print("Bo qua nhap so luong, hien thi tat ca:", courses)
except (ValueError, EOFError):
    print("So luong phai la so nguyen")


# 7. Kiem tra ham tim kiem hoc phan (search_courses)
print("\n--- Thu nghiem tim kiem hoc phan (search_courses) ---")
print("Tim kiem tu khoa 'web':", search_courses("web"))
print("Tim kiem tu khoa 'INT2205':", search_courses("INT2205"))


# 8. Kiem tra chuong trinh voi 05 tinh huong (Bai tap tu luyen muc VII.2)
print("\n" + "=" * 65)
print("KIEM TRA CAC TINH HUONG DANG KY HOC PHAN (05 TINH HUONG)")
print("=" * 65)

test_cases = [
    {
        "name": "Tinh huong 1: Dang ky thanh cong",
        "student_id": "22000002",
        "course_code": "INT2204",
        "expected": "Dang ky thanh cong (con cho, sinh vien ton tai, chua dang ky)",
    },
    {
        "name": "Tinh huong 2: Dang ky trung",
        "student_id": "22000001",
        "course_code": "INT2204",
        "expected": "That bai: Sinh vien da dang ky hoc phan nay",
    },
    {
        "name": "Tinh huong 3: Lop day (het cho)",
        "student_id": "22000002",
        "course_code": "INT2205",
        "expected": "That bai: Lop da du so luong (2/2)",
    },
    {
        "name": "Tinh huong 4: Ma hoc phan khong ton tai",
        "student_id": "22000002",
        "course_code": "INT9999",
        "expected": "That bai: Hoc phan khong ton tai",
    },
    {
        "name": "Tinh huong 5: Ma sinh vien khong ton tai",
        "student_id": "99999999",
        "course_code": "INT2204",
        "expected": "That bai: Sinh vien khong ton tai",
    },
]

for idx, tc in enumerate(test_cases, start=1):
    print(f"\n[{idx}] {tc['name']}")
    print(f"    - Dau vao   : student_id = '{tc['student_id']}', course_code = '{tc['course_code']}'")
    print(f"    - Ky vong   : {tc['expected']}")
    status, msg = enroll_student(tc["student_id"], tc["course_code"])
    print(f"    - Thuc te   : Success = {status} | Message = '{msg}'")

print("\n--- Du lieu sau khi thuc hien cac tinh huong dang ky ---")
print("courses:", courses)
print("enrollments:", enrollments)