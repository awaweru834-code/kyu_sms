/**
 * Workspace Controller with Role-Based Access Control (RBAC) & Official Receipting
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verify User Session
    const savedUser = JSON.parse(localStorage.getItem('kyu_user') || 'null');
    if (!savedUser) {
        window.location.href = '../login.html';
        return;
    }

    // Hydrate Sidebar User Info
    const userDisplay = document.getElementById('currentUserDisplay');
    const roleBadge = document.getElementById('currentRoleBadge');
    if (userDisplay) userDisplay.textContent = savedUser.username;
    if (roleBadge) roleBadge.textContent = savedUser.role.replace('_', ' ');

    // ==========================================
    // ROLE-BASED ACCESS CONTROL (RBAC) GUARD
    // ==========================================
    const currentPage = window.location.pathname.split('/').pop();

    if (savedUser.role === 'finance') {
        document.querySelectorAll('a[href="students.html"]').forEach(el => {
            el.style.display = 'none';
        });

        if (currentPage === 'students.html') {
            alert('Access Restricted: Finance Officers are only authorized to access the Tuition & Finance Ledger and Executive Overview.');
            window.location.href = 'finance.html';
            return;
        }
    }

    if (savedUser.role === 'registrar') {
        document.querySelectorAll('a[href="finance.html"]').forEach(el => {
            el.style.display = 'none';
        });

        const feeCard = document.getElementById('statOutstandingFees');
        if (feeCard) {
            feeCard.textContent = 'Restricted';
            feeCard.style.color = 'var(--text-subtle)';
        }

        if (currentPage === 'finance.html') {
            alert('Access Restricted: Academic Registrars are not authorized to access Financial Ledgers.');
            window.location.href = 'students.html';
            return;
        }
    }

    // Bind Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await API.logout();
            localStorage.removeItem('kyu_user');
            window.location.href = '../index.html';
        });
    }

    const formatKES = (amount) => {
        return 'KES ' + Number(amount || 0).toLocaleString('en-KE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // ==========================================
    // VIEW 1: EXECUTIVE DASHBOARD (dashboard.html)
    // ==========================================
    const statActive = document.getElementById('statActiveStudents');
    if (statActive) {
        const statsRes = await API.getDashboardStats();
        if (statsRes.ok && statsRes.data.status === 'success') {
            const { active_students, total_courses, outstanding_fees } = statsRes.data.data;
            statActive.textContent = active_students;
            document.getElementById('statTotalCourses').textContent = total_courses;
            if (savedUser.role !== 'registrar') {
                document.getElementById('statOutstandingFees').textContent = formatKES(outstanding_fees);
            }
        }

        const studentsRes = await API.getStudents();
        const recentBody = document.getElementById('recentStudentsBody');
        const deptList = document.getElementById('deptBreakdownList');

        if (studentsRes.ok && studentsRes.data.records) {
            const records = studentsRes.data.records;
            
            if (records.length === 0) {
                recentBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No student records found.</td></tr>`;
            } else {
                recentBody.innerHTML = records.slice(0, 5).map(s => `
                    <tr>
                        <td class="mono-label" style="color:var(--text-ink);">${s.reg_number}</td>
                        <td style="font-weight:600;">${s.name}</td>
                        <td>${s.department || 'Unassigned'}</td>
                        <td><span class="badge badge-${s.status}">${s.status}</span></td>
                        <td class="mono-label">${s.admission_date}</td>
                    </tr>
                `).join('');
            }

            const counts = {};
            records.forEach(r => {
                const dept = r.department || 'General Studies';
                counts[dept] = (counts[dept] || 0) + 1;
            });

            const entries = Object.entries(counts);
            deptList.innerHTML = entries.length === 0 
                ? `<p style="color:var(--text-muted);">No departmental data available yet.</p>`
                : entries.map(([deptName, count]) => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border-hairline);">
                        <span style="font-weight:500;">${deptName}</span>
                        <span class="mono-label" style="background:var(--bg-sand); padding:4px 10px; border-radius:99px; color:var(--text-ink);">${count} Scholars</span>
                    </div>
                `).join('');
        }
    }

    // ==========================================
    // VIEW 2: STUDENT REGISTRY (students.html)
    // ==========================================
    const studentsTableBody = document.getElementById('studentsTableBody');
    let allStudentsCache = [];

    async function loadStudentsRegistry() {
        if (!studentsTableBody) return;
        const res = await API.getStudents();
        if (res.ok && res.data.records) {
            allStudentsCache = res.data.records;
            renderStudentsTable(allStudentsCache);
        }
    }

    function renderStudentsTable(list) {
        if (!studentsTableBody) return;
        if (list.length === 0) {
            studentsTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2.5rem; color:var(--text-muted);">No matching student records found.</td></tr>`;
            return;
        }

        const canDelete = savedUser.role === 'super_admin';

        studentsTableBody.innerHTML = list.map(student => `
            <tr>
                <td class="mono-label" style="color:var(--text-ink);">${student.reg_number}</td>
                <td>
                    <div style="font-weight:600; color:var(--text-ink);">${student.name}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${student.email}</div>
                </td>
                <td>${student.department || 'SCIT'}</td>
                <td><span class="badge badge-${student.status}">${student.status}</span></td>
                <td class="mono-label">${student.admission_date}</td>
                <td>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <select class="table-action-select" data-status-id="${student.id}">
                            <option value="active" ${student.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="graduated" ${student.status === 'graduated' ? 'selected' : ''}>Graduated</option>
                            <option value="suspended" ${student.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                        </select>
                        ${canDelete ? `<button class="btn-icon-danger" data-delete-id="${student.id}">Revoke</button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('[data-status-id]').forEach(selectEl => {
            selectEl.addEventListener('change', async (e) => {
                const id = e.target.getAttribute('data-status-id');
                const newStatus = e.target.value;
                const res = await API.updateStudentStatus(id, newStatus);
                if (!res.ok) alert(res.data.message);
                loadStudentsRegistry();
            });
        });

        document.querySelectorAll('[data-delete-id]').forEach(btnEl => {
            btnEl.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-delete-id');
                if (confirm('Are you sure you want to permanently remove this student and their associated fee ledger?')) {
                    const res = await API.deleteStudent(id);
                    if (!res.ok) alert(res.data.message);
                    loadStudentsRegistry();
                }
            });
        });
    }

    if (studentsTableBody) {
        loadStudentsRegistry();

        const searchInput = document.getElementById('studentSearchInput');
        const statusFilter = document.getElementById('statusFilterSelect');

        function filterStudents() {
            const query = (searchInput.value || '').toLowerCase();
            const status = statusFilter.value;
            const filtered = allStudentsCache.filter(s => {
                const matchesQuery = s.name.toLowerCase().includes(query) ||
                                     s.reg_number.toLowerCase().includes(query) ||
                                     s.email.toLowerCase().includes(query);
                const matchesStatus = status === 'all' || s.status === status;
                return matchesQuery && matchesStatus;
            });
            renderStudentsTable(filtered);
        }

        if (searchInput) searchInput.addEventListener('input', filterStudents);
        if (statusFilter) statusFilter.addEventListener('change', filterStudents);

        const modal = document.getElementById('admitStudentModal');
        const openBtn = document.getElementById('openAdmitModalBtn');
        const closeBtn = document.getElementById('closeAdmitModalBtn');
        const admitForm = document.getElementById('admitStudentForm');

        if (openBtn) openBtn.addEventListener('click', () => modal.classList.add('open'));
        if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('open'));

        if (admitForm) {
            admitForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const payload = {
                    reg_number: document.getElementById('reg_number').value.trim(),
                    first_name: document.getElementById('first_name').value.trim(),
                    last_name: document.getElementById('last_name').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    department_id: document.getElementById('department_id').value
                };

                const res = await API.createStudent(payload);
                if (res.ok && res.data.status === 'success') {
                    admitForm.reset();
                    modal.classList.remove('open');
                    loadStudentsRegistry();
                } else {
                    alert(res.data.message || 'Could not admit student.');
                }
            });
        }
    }

    // ==========================================
    // VIEW 3: FINANCE LEDGER & RECEIPTING (finance.html)
    // ==========================================
    const financeTableBody = document.getElementById('financeTableBody');
    const paymentModal = document.getElementById('paymentModal');
    const closePaymentModalBtn = document.getElementById('closePaymentModalBtn');
    const recordPaymentForm = document.getElementById('recordPaymentForm');

    const receiptModal = document.getElementById('receiptModal');
    const closeReceiptModalBtn = document.getElementById('closeReceiptModalBtn');
    const printReceiptBtn = document.getElementById('printReceiptBtn');

    let financeRecordsCache = [];

    function openReceiptModal(receipt) {
        if (!receiptModal) return;
        document.getElementById('rcpNumber').textContent = receipt.receipt_no;
        document.getElementById('rcpScholarName').textContent = receipt.scholar_name;
        document.getElementById('rcpDate').textContent = receipt.date_issued;
        document.getElementById('rcpRegNo').textContent = receipt.reg_number;
        document.getElementById('rcpDepartment').textContent = receipt.department || 'Academic Registry';
        document.getElementById('rcpTotalBilled').textContent = formatKES(receipt.total_billed);
        document.getElementById('rcpTotalPaid').textContent = formatKES(receipt.total_paid);
        document.getElementById('rcpBalance').textContent = formatKES(receipt.balance);
        document.getElementById('rcpIssuedBy').textContent = savedUser.username;

        const currentTxRow = document.getElementById('rcpCurrentTxRow');
        if (receipt.amount_paid_now && parseFloat(receipt.amount_paid_now) > 0) {
            currentTxRow.style.display = 'flex';
            document.getElementById('rcpAmountNow').textContent = formatKES(receipt.amount_paid_now);
        } else {
            // Hide single-transaction row when viewing a cumulative statement receipt from the table
            currentTxRow.style.display = 'none';
        }

        receiptModal.classList.add('open');
    }

    async function loadFinanceLedger() {
        if (!financeTableBody) return;
        const res = await API.getFinanceRecords();
        if (res.ok && res.data.records) {
            financeRecordsCache = res.data.records;
            let totalBilled = 0, totalPaid = 0, totalBalance = 0;

            financeRecordsCache.forEach(r => {
                totalBilled += parseFloat(r.amount_due || 0);
                totalPaid += parseFloat(r.amount_paid || 0);
                totalBalance += parseFloat(r.balance || 0);
            });

            document.getElementById('totalBilledStat').textContent = formatKES(totalBilled);
            document.getElementById('totalPaidStat').textContent = formatKES(totalPaid);
            document.getElementById('totalBalanceStat').textContent = formatKES(totalBalance);

            if (financeRecordsCache.length === 0) {
                financeTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2.5rem; color:var(--text-muted);">No fee accounts found.</td></tr>`;
                return;
            }

            financeTableBody.innerHTML = financeRecordsCache.map(f => {
                const isCleared = parseFloat(f.balance) <= 0;
                const hasPaidAnything = parseFloat(f.amount_paid) > 0;
                const fullName = `${f.first_name} ${f.last_name}`;

                return `
                    <tr>
                        <td class="mono-label" style="color:var(--text-ink);">${f.reg_number}</td>
                        <td style="font-weight:600;">${fullName}</td>
                        <td class="mono-label">${formatKES(f.amount_due)}</td>
                        <td class="mono-label" style="color:var(--status-active-text);">${formatKES(f.amount_paid)}</td>
                        <td class="mono-label" style="font-weight:700; color:${isCleared ? 'var(--status-active-text)' : 'var(--status-susp-text)'};">
                            ${formatKES(f.balance)}
                        </td>
                        <td>
                            <span class="badge ${isCleared ? 'badge-active' : 'badge-suspended'}">
                                ${isCleared ? 'Cleared' : 'Arrears'}
                            </span>
                        </td>
                        <td class="no-print">
                            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                                ${!isCleared ? `
                                    <button class="btn btn-primary" style="padding:6px 14px; font-size:0.78rem;"
                                        data-pay-id="${f.id}" 
                                        data-pay-name="${fullName} (${f.reg_number})" 
                                        data-pay-balance="${f.balance}">
                                        + Pay Fee
                                    </button>
                                ` : ''}
                                ${hasPaidAnything ? `
                                    <button class="btn btn-outline" style="padding:6px 14px; font-size:0.78rem;"
                                        data-receipt-id="${f.id}">
                                         Receipt
                                    </button>
                                ` : `<span class="mono-label" style="color:var(--text-subtle);">Unpaid</span>`}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Bind "+ Pay Fee" buttons
            document.querySelectorAll('[data-pay-id]').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.getElementById('payment_fee_id').value = btn.getAttribute('data-pay-id');
                    document.getElementById('payment_scholar_name').value = btn.getAttribute('data-pay-name');
                    document.getElementById('payment_current_balance').value = formatKES(btn.getAttribute('data-pay-balance'));
                    document.getElementById('payment_amount').max = btn.getAttribute('data-pay-balance');
                    document.getElementById('payment_amount').value = '';
                    paymentModal.classList.add('open');
                });
            });

            // Bind "📄 Receipt" buttons for any scholar who has paid fees
            document.querySelectorAll('[data-receipt-id]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const feeId = btn.getAttribute('data-receipt-id');
                    const record = financeRecordsCache.find(r => String(r.id) === String(feeId));
                    if (record) {
                        openReceiptModal({
                            receipt_no: `KYU-STMT-${String(record.id).padStart(4, '0')}`,
                            date_issued: record.last_payment_date || new Date().toLocaleDateString('en-KE'),
                            scholar_name: `${record.first_name} ${record.last_name}`,
                            reg_number: record.reg_number,
                            department: record.department || 'Academic Registry',
                            amount_paid_now: 0,
                            total_billed: record.amount_due,
                            total_paid: record.amount_paid,
                            balance: record.balance
                        });
                    }
                });
            });
        }
    }

    if (financeTableBody) {
        loadFinanceLedger();

        if (closePaymentModalBtn) {
            closePaymentModalBtn.addEventListener('click', () => paymentModal.classList.remove('open'));
        }

        if (closeReceiptModalBtn) {
            closeReceiptModalBtn.addEventListener('click', () => receiptModal.classList.remove('open'));
        }

        if (printReceiptBtn) {
            printReceiptBtn.addEventListener('click', () => {
                document.body.classList.add('printing-receipt');
                window.print();
                setTimeout(() => document.body.classList.remove('printing-receipt'), 500);
            });
        }

        if (recordPaymentForm) {
            recordPaymentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const feeId = document.getElementById('payment_fee_id').value;
                const amount = document.getElementById('payment_amount').value;

                const res = await API.recordPayment(feeId, amount);
                if (res.ok && res.data.status === 'success') {
                    paymentModal.classList.remove('open');
                    await loadFinanceLedger();
                    // Automatically present the official receipt for the payment just recorded
                    if (res.data.receipt) {
                        openReceiptModal(res.data.receipt);
                    }
                } else {
                    alert(res.data.message || 'Error recording payment.');
                }
            });
        }

        const printBtn = document.getElementById('printLedgerBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                document.body.classList.remove('printing-receipt');
                window.print();
            });
        }
    }
});