const STUDENT_API = "/api/students";
let searchTimer;
let latestRequest = 0;
let alertTimer;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addStudentButton").addEventListener("click", () => openStudentForm());
    document.getElementById("searchForm").addEventListener("submit", event => {
        event.preventDefault();
        loadStudents(document.getElementById("searchInput").value.trim());
    });
    document.getElementById("searchInput").addEventListener("input", event => {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => loadStudents(event.target.value.trim()), 300);
    });
    document.getElementById("clearSearchButton").addEventListener("click", () => {
        const searchInput = document.getElementById("searchInput");
        searchInput.value = "";
        searchInput.focus();
        loadStudents();
    });
    document.getElementById("studentForm").addEventListener("submit", saveStudent);
    document.getElementById("studentTableBody").addEventListener("click", handleTableAction);

    loadStudents();
});

async function requestApi(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });

    if (!response.ok) {
        let message = `Yêu cầu thất bại (HTTP ${response.status}).`;
        try {
            const body = await response.json();
            message = body.message || body.detail || message;
        } catch {
            // The server may return an empty response or plain text.
        }
        throw new Error(message);
    }

    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

async function loadStudents(keyword = "") {
    const requestId = ++latestRequest;
    const tbody = document.getElementById("studentTableBody");
    const resultSummary = document.getElementById("resultSummary");
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-secondary"><span class="spinner-border spinner-border-sm me-2" role="status"></span>Đang tải danh sách...</td></tr>`;
    resultSummary.textContent = "Đang tải dữ liệu...";

    const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
    try {
        const students = await requestApi(`${STUDENT_API}${query}`);
        if (requestId !== latestRequest) return;
        renderStudents(Array.isArray(students) ? students : []);
        hideAlert();
        return true;
    } catch (error) {
        if (requestId !== latestRequest) return;
        tbody.innerHTML = "";
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.className = "text-center py-5 text-danger";
        cell.textContent = "Không thể tải danh sách sinh viên.";
        row.append(cell);
        tbody.append(row);
        resultSummary.textContent = "Không tải được dữ liệu";
        showAlert(`${error.message} Hãy kiểm tra ứng dụng và kết nối cơ sở dữ liệu rồi thử tải lại.`, "danger");
        return false;
    }
}

function renderStudents(students) {
    const tbody = document.getElementById("studentTableBody");
    const keyword = document.getElementById("searchInput").value.trim();
    tbody.replaceChildren();
    document.getElementById("studentCount").textContent = students.length.toLocaleString("vi-VN");
    document.getElementById("resultSummary").textContent = keyword
        ? `Tìm thấy ${students.length} sinh viên cho “${keyword}”`
        : `Hiển thị ${students.length} sinh viên`;

    if (students.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.className = "text-center py-5";
        cell.innerHTML = '<div class="text-secondary mb-2"><i class="bi bi-person-exclamation fs-2"></i></div><div class="fw-semibold">Không tìm thấy sinh viên</div><div class="text-secondary small">Thử từ khóa khác hoặc thêm hồ sơ mới.</div>';
        row.append(cell);
        tbody.append(row);
        return;
    }

    const rows = students.map(student => createStudentRow(student));
    tbody.append(...rows);
}

function createStudentRow(student) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.className = "ps-4";
    const identity = document.createElement("div");
    identity.className = "d-flex align-items-center gap-2";
    const avatar = document.createElement("span");
    avatar.className = "student-avatar flex-shrink-0";
    avatar.textContent = getInitials(student.fullName);
    const name = document.createElement("span");
    name.className = "fw-semibold text-body";
    name.textContent = student.fullName || "Chưa cập nhật";
    identity.append(avatar, name);
    nameCell.append(identity);

    row.append(
        nameCell,
        createTextCell(student.studentCode, "font-monospace small"),
        createTextCell(student.email || "—"),
        createTextCell(student.phone || "—"),
        createTextCell(student.className || "—")
    );

    const actionsCell = document.createElement("td");
    actionsCell.className = "text-center pe-4";
    const actions = document.createElement("div");
    actions.className = "action-buttons d-inline-flex gap-1";
    actions.append(
        createActionButton("edit", student.id, "Sửa hồ sơ", "bi-pencil-square", "btn-outline-primary"),
        createActionButton("delete", student.id, "Xóa hồ sơ", "bi-trash3", "btn-outline-danger")
    );
    actionsCell.append(actions);
    row.append(actionsCell);
    return row;
}

function createTextCell(value, className = "") {
    const cell = document.createElement("td");
    cell.className = className;
    cell.textContent = value || "—";
    return cell;
}

function createActionButton(action, id, label, icon, style) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `btn btn-sm ${style}`;
    button.dataset.action = action;
    button.dataset.id = id;
    button.title = label;
    button.setAttribute("aria-label", label);
    const iconElement = document.createElement("i");
    iconElement.className = `bi ${icon}`;
    button.append(iconElement);
    return button;
}

function getInitials(fullName = "") {
    const words = fullName.trim().split(/\s+/).filter(Boolean);
    return words.length ? words.slice(-2).map(word => word[0]).join("").toLocaleUpperCase("vi-VN") : "SV";
}

async function handleTableAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (button.dataset.action === "edit") {
        try {
            const student = await requestApi(`${STUDENT_API}/${encodeURIComponent(button.dataset.id)}`);
            openStudentForm(student);
        } catch (error) {
            showAlert(`Không thể tải hồ sơ: ${error.message}`, "danger");
        }
        return;
    }

    if (button.dataset.action === "delete") {
        const studentName = button.closest("tr").querySelector("td:nth-child(1) .fw-semibold").textContent;
        if (!window.confirm(`Bạn có chắc muốn xóa sinh viên “${studentName}” không?`)) return;

        button.disabled = true;
        try {
            await requestApi(`${STUDENT_API}/${encodeURIComponent(button.dataset.id)}`, { method: "DELETE" });
            const loaded = await loadStudents(document.getElementById("searchInput").value.trim());
            if (loaded) showAlert("Đã xóa hồ sơ sinh viên thành công.", "success");
        } catch (error) {
            button.disabled = false;
            showAlert(`Không thể xóa sinh viên: ${error.message}`, "danger");
        }
    }
}

function openStudentForm(student = null) {
    const form = document.getElementById("studentForm");
    form.reset();
    document.getElementById("studentId").value = student?.id || "";
    document.getElementById("studentModalTitle").textContent = student ? "Cập nhật sinh viên" : "Thêm sinh viên";
    document.getElementById("saveStudentButton").innerHTML = student
        ? '<i class="bi bi-check-lg me-1"></i>Cập nhật'
        : '<i class="bi bi-check-lg me-1"></i>Lưu thông tin';
    document.getElementById("studentCode").value = student?.studentCode || "";
    document.getElementById("fullName").value = student?.fullName || "";
    document.getElementById("email").value = student?.email || "";
    document.getElementById("phone").value = student?.phone || "";
    document.getElementById("className").value = student?.className || "";
    bootstrap.Modal.getOrCreateInstance(document.getElementById("studentModal")).show();
}

async function saveStudent(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const id = document.getElementById("studentId").value;
    const payload = {
        studentCode: document.getElementById("studentCode").value.trim(),
        fullName: document.getElementById("fullName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        className: document.getElementById("className").value.trim()
    };
    const saveButton = document.getElementById("saveStudentButton");
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Đang lưu...';

    try {
        await requestApi(id ? `${STUDENT_API}/${encodeURIComponent(id)}` : STUDENT_API, {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(payload)
        });
        bootstrap.Modal.getOrCreateInstance(document.getElementById("studentModal")).hide();
        const loaded = await loadStudents(document.getElementById("searchInput").value.trim());
        if (loaded) showAlert(id ? "Đã cập nhật hồ sơ sinh viên." : "Đã thêm sinh viên mới.", "success");
    } catch (error) {
        showAlert(`Không thể lưu hồ sơ: ${error.message}`, "danger");
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = id
            ? '<i class="bi bi-check-lg me-1"></i>Cập nhật'
            : '<i class="bi bi-check-lg me-1"></i>Lưu thông tin';
    }
}

function showAlert(message, type) {
    const alert = document.getElementById("pageAlert");
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.replaceChildren(document.createTextNode(message));
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "btn-close";
    closeButton.setAttribute("data-bs-dismiss", "alert");
    closeButton.setAttribute("aria-label", "Đóng");
    alert.append(closeButton);
    window.clearTimeout(alertTimer);
    if (type === "success") {
        alertTimer = window.setTimeout(() => hideAlert(), 4500);
    }
}

function hideAlert() {
    const alert = document.getElementById("pageAlert");
    alert.className = "alert d-none";
    alert.replaceChildren();
}
