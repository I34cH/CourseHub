import { useEffect, useState } from "react";
import { api } from "./api.js";
import Notice from "./components/Notice.jsx";
import StudentForm from "./components/StudentForm.jsx";
import SectionTable from "./components/SectionTable.jsx";
import EnrollmentList from "./components/EnrollmentList.jsx";
import EventHistory from "./components/EventHistory.jsx";

const EVENT_PAGE_SIZE = 5;

export default function App() {
  const [draftId, setDraftId] = useState("22000004");
  const [studentId, setStudentId] = useState("22000004");
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState({ kind: "info", text: "" });
  const [refresh, setRefresh] = useState(0);

  // Bài 3: Lịch sử sự kiện có phân trang
  const [events, setEvents] = useState([]);
  const [eventPage, setEventPage] = useState(0);
  const [hasMoreEvents, setHasMoreEvents] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [courseData, sectionData, enrollmentData] = await Promise.all([
          api("/courses", options),
          api("/sections", options),
          api(`/students/${encodeURIComponent(studentId)}/enrollments`, options),
        ]);
        if (controller.signal.aborted) return;
        setCourses(courseData);
        setSections(sectionData);
        setEnrollments(enrollmentData);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.message);
        setCourses([]);
        setSections([]);
        setEnrollments([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadData();
    return () => controller.abort();
  }, [studentId, refresh]);

  // Tải lịch sử sự kiện (Bài 3)
  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };

    async function loadEvents() {
      setLoadingEvents(true);
      try {
        const skip = eventPage * EVENT_PAGE_SIZE;
        const data = await api(
          `/enrollment-events?student_id=${encodeURIComponent(
            studentId,
          )}&skip=${skip}&limit=${EVENT_PAGE_SIZE + 1}`,
          options,
        );
        if (controller.signal.aborted) return;
        if (Array.isArray(data)) {
          // Lọc chỉ sự kiện demo của sinh viên
          const demoEvents = data.filter((item) => item.dataset === "demo");
          if (demoEvents.length > EVENT_PAGE_SIZE) {
            setHasMoreEvents(true);
            setEvents(demoEvents.slice(0, EVENT_PAGE_SIZE));
          } else {
            setHasMoreEvents(data.length > EVENT_PAGE_SIZE);
            setEvents(demoEvents.slice(0, EVENT_PAGE_SIZE));
          }
        }
      } catch {
        if (controller.signal.aborted) return;
        setEvents([]);
        setHasMoreEvents(false);
      } finally {
        if (!controller.signal.aborted) setLoadingEvents(false);
      }
    }

    loadEvents();
    return () => controller.abort();
  }, [studentId, refresh, eventPage]);

  function chooseStudent(event) {
    event.preventDefault();
    const nextId = draftId.trim();
    if (!/^\d{8}$/.test(nextId)) {
      setNotice({ kind: "error", text: "Mã demo phải gồm 8 chữ số." });
      return;
    }
    setNotice({ kind: "info", text: "" });
    setLoading(true);
    setEventPage(0);
    setStudentId(nextId);
    setRefresh((value) => value + 1);
  }

  async function changeEnrollment(sectionId, cancel = false) {
    if (busy || loading || error) return;
    if (cancel && !window.confirm(`Hủy đăng ký lớp ${sectionId}?`)) return;
    setBusy(true);
    setNotice({ kind: "info", text: "Đang gửi yêu cầu..." });
    try {
      if (cancel) {
        await api(
          `/enrollments/${encodeURIComponent(studentId)}/${encodeURIComponent(
            sectionId,
          )}`,
          { method: "DELETE" },
        );
      } else {
        await api("/enrollments", {
          method: "POST",
          body: { student_id: studentId, class_section_id: sectionId },
        });
      }
      setNotice({
        kind: "success",
        text: cancel
          ? `Đã hủy đăng ký ${sectionId}.`
          : `Đăng ký ${sectionId} thành công.`,
      });
    } catch (err) {
      setNotice({ kind: "error", text: err.message });
    } finally {
      // Đọc lại CSDL kể cả sau lỗi; không tự cộng/trừ số chỗ ở giao diện.
      setLoading(true);
      setRefresh((value) => value + 1);
      setBusy(false);
    }
  }

  const keyword = search.trim().toLowerCase();
  const rows = sections
    .map((section) => ({
      ...section,
      course_name:
        courses.find((course) => course.code === section.course_code)?.name ??
        section.course_code,
      registered: enrollments.some(
        (item) => item.class_section_id === section.class_id,
      ),
    }))
    .filter(
      (row) =>
        `${row.class_id} ${row.course_code} ${row.course_name}`
          .toLowerCase()
          .includes(keyword) &&
        (!onlyAvailable || row.remaining > 0) &&
        (!selectedCourse || row.course_code === selectedCourse),
    );

  const disabled = loading || busy || Boolean(error);

  return (
    <main className="container">
      <header className="hero">
        <p className="eyebrow">CSDL WEB VÀ HỆ THỐNG THÔNG TIN · BUỔI 5</p>
        <h1>CourseHub</h1>
        <p>Tra cứu và đăng ký lớp học phần</p>
        <span className="chip">React → FastAPI → PostgreSQL</span>
      </header>
      <p className="demo-note">
        Môi trường thực hành. Nhập mã sinh viên để thử dữ liệu, không phải đăng
        nhập.
      </p>

      {/* Bài 1: Form chọn sinh viên tách thành StudentForm.jsx */}
      <StudentForm
        draftId={draftId}
        onChangeDraftId={setDraftId}
        onSubmit={chooseStudent}
        studentId={studentId}
        busy={busy}
        loading={loading}
        onRefresh={() => setRefresh((value) => value + 1)}
      />

      <Notice kind={notice.kind}>{notice.text}</Notice>
      <Notice kind="error">{error}</Notice>
      {loading && <Notice>Đang tải dữ liệu từ API...</Notice>}

      {!loading && !error && (
        <div className="workspace">
          <section className="panel">
            <h2>2. Danh sách lớp học phần</h2>
            <div className="filters">
              <label htmlFor="search">Tìm lớp / học phần</label>
              <input
                id="search"
                value={search}
                placeholder="Ví dụ: web"
                onChange={(e) => setSearch(e.target.value)}
              />

              {/* Bài 2: Bộ lọc học phần theo mã INT2204/INT2205/INT2206 */}
              <select
                aria-label="Lọc theo học phần"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">Tất cả học phần</option>
                {courses.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>

              <label className="check">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                />
                Chỉ hiện lớp còn chỗ
              </label>
            </div>
            <SectionTable
              rows={rows}
              disabled={disabled}
              onEnroll={(id) => changeEnrollment(id)}
            />
          </section>

          <section className="panel">
            <h2>3. Lớp đã đăng ký</h2>
            <p className="muted">
              Sinh viên {studentId} · {enrollments.length} lớp
            </p>
            <EnrollmentList
              rows={enrollments}
              disabled={disabled}
              onCancel={(id) => changeEnrollment(id, true)}
            />
          </section>
        </div>
      )}

      {/* Bài 3: Bảng lịch sử sự kiện của sinh viên có phân trang */}
      {!loading && !error && (
        <EventHistory
          events={events}
          loading={loadingEvents}
          page={eventPage}
          onPrevPage={() => setEventPage((p) => Math.max(0, p - 1))}
          onNextPage={() => setEventPage((p) => p + 1)}
          hasMore={hasMoreEvents}
        />
      )}

      <footer>
        Số chỗ và đăng ký được đọc từ API; Backend quyết định tính hợp lệ.
      </footer>
    </main>
  );
}

