export default function EventHistory({
  events,
  loading,
  page,
  onPrevPage,
  onNextPage,
  hasMore,
}) {
  return (
    <section className="panel">
      <h2>4. Lịch sử sự kiện (Audit Log)</h2>
      {events.length === 0 && !loading ? (
        <p className="muted">Chưa có sự kiện nào của sinh viên trong bộ demo.</p>
      ) : (
        <>
          <div className="table-scroll">
            <table aria-label="Lịch sử sự kiện">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mã lớp</th>
                  <th>Hành động</th>
                  <th>Nguồn</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id}>
                    <td>{ev.id}</td>
                    <td>
                      <strong>{ev.class_section_id}</strong>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          ev.event_type === "CREATED" ? "created" : "cancelled"
                        }`}
                      >
                        {ev.event_type === "CREATED" ? "Đăng ký" : "Hủy đăng ký"}
                      </span>
                    </td>
                    <td>{ev.source}</td>
                    <td>{new Date(ev.occurred_at).toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button
              type="button"
              className="secondary"
              disabled={page <= 0 || loading}
              onClick={onPrevPage}
            >
              &larr; Trang trước
            </button>
            <span className="muted">Trang {page + 1}</span>
            <button
              type="button"
              className="secondary"
              disabled={!hasMore || loading}
              onClick={onNextPage}
            >
              Trang sau &rarr;
            </button>
          </div>
        </>
      )}
    </section>
  );
}

