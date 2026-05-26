/* DATABASE AKUN */
const STORAGE_KEY = "nemo_accounts";

function getAccounts() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    // Default admin account seeded on first visit
    const defaults = [
        { id: 1, username: "nemo", password: "nemo123", displayName: "Babygurl", email: "user@nemo.io", role: "admin", createdAt: new Date().toISOString() }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
}

function saveAccounts(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function nextId(list) {
    return list.length === 0 ? 1 : Math.max(...list.map(a => a.id)) + 1;
}

const loginScreen  = document.getElementById("loginScreen");
const appContainer = document.getElementById("appContainer");
const loginForm    = document.getElementById("loginForm");
const loginError   = document.getElementById("loginError");
const togglePw     = document.getElementById("togglePw");
const loginPassEl  = document.getElementById("loginPass");

let currentUser = null;

togglePw.addEventListener("click", () => {
    const isHidden = loginPassEl.type === "password";
    loginPassEl.type = isHidden ? "text" : "password";
    togglePw.querySelector("i").className = isHidden ? "fas fa-eye-slash" : "fas fa-eye";
});

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const inputUser = document.getElementById("loginUser").value.trim().toLowerCase();
    const inputPass = loginPassEl.value;

    const accounts = getAccounts();
    const match = accounts.find(a => a.username.toLowerCase() === inputUser && a.password === inputPass);

    if (match) {
        currentUser = match;
        loginError.style.display = "none";
        loginScreen.classList.add("fade-out");

        const name = match.displayName || match.username;
        const initial = name.charAt(0).toUpperCase();
        setById("headerName", name);
        setById("headerAvatar", initial);
        setById("profileNameDisplay", name);
        setById("profileAvatarDisplay", initial);
        const emailEl = document.getElementById("profileEmail");
        if (emailEl) emailEl.value = match.email || "";
        const nameEl = document.getElementById("profileName");
        if (nameEl) nameEl.value = name;

        setTimeout(() => {
            loginScreen.style.display = "none";
            appContainer.style.display = "grid";
            // Show Accounts tab only for admin
            if (match.role === "admin") {
                document.getElementById("navAccounts").style.display = "flex";
                document.getElementById("adminMenuHeading").style.display = "block";
            }
            renderUsersTable();
        }, 380);
    } else {
        loginError.style.display = "flex";
        loginPassEl.value = "";
        loginPassEl.focus();
    }
});

function renderUsersTable() {
    const tbody = document.getElementById("usersTableBody");
    const countEl = document.getElementById("accountCount");
    if (!tbody) return;

    const accounts = getAccounts();
    if (countEl) countEl.textContent = `${accounts.length} account${accounts.length !== 1 ? "s" : ""}`;

    if (accounts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#aaa;padding:30px;">No accounts yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = accounts.map((u, i) => {
        const roleHtml = u.role === "admin"
            ? `<span class="status active"><i class="fas fa-shield-halved"></i> Admin</span>`
            : `<span class="status pending"><i class="fas fa-user"></i> User</span>`;
        const created = new Date(u.createdAt).toLocaleDateString();
        const isSelf = currentUser && u.id === currentUser.id;
        const actionHtml = isSelf
            ? `<span style="font-size:12px;color:#aaa;font-style:italic;">You</span>`
            : `<button class="btn btn-outline btn-sm acc-delete-btn" data-id="${u.id}" data-name="${u.username}">
                 <i class="fas fa-trash"></i> Delete
               </button>`;
        return `<tr>
            <td>${i + 1}</td>
            <td><strong>${u.username}</strong></td>
            <td>${u.displayName || "–"}</td>
            <td style="font-size:13px;color:#888;">${u.email || "–"}</td>
            <td>${roleHtml}</td>
            <td style="font-size:12px;color:#888;">${created}</td>
            <td>${actionHtml}</td>
        </tr>`;
    }).join("");

    tbody.querySelectorAll(".acc-delete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            const name = btn.dataset.name;
            if (!confirm(`Delete account "${name}"? This cannot be undone.`)) return;
            let accounts = getAccounts();
            accounts = accounts.filter(a => a.id !== id);
            saveAccounts(accounts);
            renderUsersTable();
            showFeedback("addUserFeedback", `Account "${name}" deleted.`, "success");
        });
    });
}

document.getElementById("addUserBtn").addEventListener("click", () => {
    const username    = document.getElementById("newUsername").value.trim().toLowerCase();
    const password    = document.getElementById("newPassword").value;
    const displayName = document.getElementById("newDisplayName").value.trim();
    const email       = document.getElementById("newEmail").value.trim();
    const role        = document.getElementById("newRole").value;

    if (!username) { showFeedback("addUserFeedback", "Username is required.", "error"); return; }
    if (!password) { showFeedback("addUserFeedback", "Password is required.", "error"); return; }
    if (password.length < 4) { showFeedback("addUserFeedback", "Password must be at least 4 characters.", "error"); return; }

    const accounts = getAccounts();
    if (accounts.find(a => a.username.toLowerCase() === username)) {
        showFeedback("addUserFeedback", `Username "${username}" already exists.`, "error");
        return;
    }

    accounts.push({ id: nextId(accounts), username, password, displayName: displayName || username, email, role, createdAt: new Date().toISOString() });
    saveAccounts(accounts);
    renderUsersTable();

    document.getElementById("newUsername").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("newDisplayName").value = "";
    document.getElementById("newEmail").value = "";
    document.getElementById("newRole").value = "user";
    showFeedback("addUserFeedback", `Account "${username}" added successfully.`, "success");
});

document.getElementById("toggleNewPw").addEventListener("click", () => {
    const inp = document.getElementById("newPassword");
    const isHidden = inp.type === "password";
    inp.type = isHidden ? "text" : "password";
    document.getElementById("toggleNewPw").querySelector("i").className = isHidden ? "fas fa-eye-slash" : "fas fa-eye";
});

const sidebar        = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebarToggle  = document.getElementById("sidebarToggle");
const sidebarClose   = document.getElementById("sidebarClose");

function openSidebar() {
    sidebar.classList.add("active");
    sidebarOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    sidebar.classList.remove("active");
    sidebarOverlay.classList.remove("active");
    document.body.style.overflow = "";
}

sidebarToggle.addEventListener("click", openSidebar);
sidebarClose.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

document.querySelectorAll(".nav-item[data-page]").forEach(item => {
    item.addEventListener("click", () => {
        if (window.innerWidth <= 992) closeSidebar();
    });
});

let msgCount = 0;
let feedCount = 0;
let sensorLogEntries = [];
let feedingHistory = [];
let connectedAt = null;
let sessionStart = Date.now();
let logLimit = 100;

/* BROKER yg di JS */

const clientId = "ALIE" + Math.random().toString(16).substr(2, 8);
const host = "wss://nemoco.cloud.shiftr.io:443/mqtt";
const mqttOptions = {
    clientId,
    username: "nemoco",
    password: "jqpwAcDcvE1xUVzG",
    clean: true,
};

document.getElementById("deviceBroker").textContent = host;
document.getElementById("deviceClientId").textContent = clientId;

console.log("Connect to Broker");
let client = mqtt.connect(host, mqttOptions);

function subscribeTopics() {
    client.subscribe("NEMO/#", { qos: 1 });
}

client.on("connect", () => {
    console.log("CONNECTED");
    connectedAt = new Date();
    document.getElementById("Status").innerHTML = "Connected";
    document.getElementById("Status").style.color = "green";
    document.getElementById("deviceConnBadge").textContent = "Connected";
    document.getElementById("deviceConnBadge").className = "status-badge badge-connected";
    document.getElementById("deviceConnectedAt").textContent = connectedAt.toLocaleString();
    subscribeTopics();
});

client.on("message", (topic, data) => {
    const value = data.toString();
    msgCount++;
    document.getElementById("deviceMsgCount").textContent = msgCount;
    document.getElementById("sumMsgCount").textContent = msgCount;

    addSensorLog(topic, value);

    if (topic === "NEMO/tem") {
        setById("tem", value);
        setById("dc-tem", value);
        setById("dc-tem-time", "Updated " + timeStr());
    }

    if (topic === "NEMO/hum") {
        setById("hum", value);
        setById("dc-hum", value);
        setById("dc-hum-time", "Updated " + timeStr());
    }

    if (topic === "NEMO/waterlevel") {
        const num = parseInt(value);
        const percent = mapValue(num, 0, 4095, 0, 100) + "%";
        setById("waterval", percent);
        setById("dc-water", percent);
        setById("dc-water-time", "Updated " + timeStr());
    }

    if (topic === "NEMO/serv0Status") {
        const toggle = document.getElementById("toggle");
        setById("servo", value);
        setById("dc-servo", value);
        setById("dc-servo-time", "Updated " + timeStr());

        const servoEl = document.getElementById("servo");
        const dcServoEl = document.getElementById("dc-servo");
        if (value === "ON") {
            if (servoEl) servoEl.style.color = "green";
            if (dcServoEl) dcServoEl.style.color = "green";
            if (toggle) toggle.checked = true;
        } else {
            if (servoEl) servoEl.style.color = "red";
            if (dcServoEl) dcServoEl.style.color = "red";
            if (toggle) toggle.checked = false;
        }

        addFeedingEvent(value);
    }
});

client.on("error", (err) => { console.log("ERROR:", err); });
client.on("offline", () => {
    console.log("OFFLINE");
    document.getElementById("Status").innerHTML = "Disconnected";
    document.getElementById("Status").style.color = "red";
    document.getElementById("deviceConnBadge").textContent = "Disconnected";
    document.getElementById("deviceConnBadge").className = "status-badge";
});
client.on("close", () => { console.log("CLOSED"); });

const toggle = document.getElementById("toggle");
toggle.addEventListener("change", () => {
    const cmd = toggle.checked ? "ON" : "OFF";
    client.publish("NEMO/serv0", cmd);
});

document.getElementById("reconnectBtn").addEventListener("click", () => {
    client.end(true, () => {
        client = mqtt.connect(host, mqttOptions);
        client.on("connect", () => {
            connectedAt = new Date();
            document.getElementById("Status").innerHTML = "Connected";
            document.getElementById("Status").style.color = "green";
            document.getElementById("deviceConnBadge").textContent = "Connected";
            document.getElementById("deviceConnBadge").className = "status-badge badge-connected";
            document.getElementById("deviceConnectedAt").textContent = connectedAt.toLocaleString();
            subscribeTopics();
        });
        client.on("message", (topic, data) => {
            const value = data.toString();
            msgCount++;
            document.getElementById("deviceMsgCount").textContent = msgCount;
            document.getElementById("sumMsgCount").textContent = msgCount;
            addSensorLog(topic, value);
            if (topic === "NEMO/tem") { setById("tem", value); setById("dc-tem", value); setById("dc-tem-time", "Updated " + timeStr()); }
            if (topic === "NEMO/hum") { setById("hum", value); setById("dc-hum", value); setById("dc-hum-time", "Updated " + timeStr()); }
            if (topic === "NEMO/waterlevel") {
                const pct = mapValue(parseInt(value), 0, 4095, 0, 100) + "%";
                setById("waterval", pct); setById("dc-water", pct); setById("dc-water-time", "Updated " + timeStr());
            }
            if (topic === "NEMO/serv0Status") {
                setById("servo", value); setById("dc-servo", value); setById("dc-servo-time", "Updated " + timeStr());
                const t2 = document.getElementById("toggle");
                const s1 = document.getElementById("servo");
                const s2 = document.getElementById("dc-servo");
                if (value === "ON") { if(s1) s1.style.color="green"; if(s2) s2.style.color="green"; if(t2) t2.checked=true; }
                else { if(s1) s1.style.color="red"; if(s2) s2.style.color="red"; if(t2) t2.checked=false; }
                addFeedingEvent(value);
            }
        });
        client.on("offline", () => {
            document.getElementById("Status").innerHTML = "Disconnected";
            document.getElementById("Status").style.color = "red";
            document.getElementById("deviceConnBadge").textContent = "Disconnected";
            document.getElementById("deviceConnBadge").className = "status-badge";
        });
    });
});

function addSensorLog(topic, value) {
    const sensorNames = {
        "NEMO/hum": "Humidity",
        "NEMO/tem": "Temperature",
        "NEMO/waterlevel": "Water Level",
        "NEMO/serv0Status": "Servo",
    };
    const sensorName = sensorNames[topic] || topic;

    sensorLogEntries.unshift({ topic, sensorName, value, time: new Date() });
    if (sensorLogEntries.length > logLimit) sensorLogEntries = sensorLogEntries.slice(0, logLimit);

    renderSensorLog();
}

function renderSensorLog() {
    const filter = document.getElementById("sensorFilter").value;
    const tbody = document.getElementById("sensorLogBody");
    const noRow = document.getElementById("noSensorRow");

    const filtered = filter === "all" ? sensorLogEntries : sensorLogEntries.filter(e => e.topic === filter);

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr id="noSensorRow"><td colspan="5" style="text-align:center;color:#aaa;padding:30px;">Waiting for sensor data…</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map((e, i) => {
        const topicClass = {
            "NEMO/hum": "dot-purple",
            "NEMO/tem": "dot-blue",
            "NEMO/waterlevel": "dot-green",
            "NEMO/serv0Status": "dot-pink",
        }[e.topic] || "";
        return `<tr>
            <td>${filtered.length - i}</td>
            <td><span style="display:inline-flex;align-items:center;gap:7px;"><span class="topic-dot ${topicClass}" style="flex-shrink:0;"></span>${e.sensorName}</span></td>
            <td style="font-size:12px;color:#888;">${e.topic}</td>
            <td><strong>${e.value}</strong></td>
            <td style="font-size:12px;color:#888;">${e.time.toLocaleString()}</td>
        </tr>`;
    }).join("");
}

document.getElementById("sensorFilter").addEventListener("change", renderSensorLog);
document.getElementById("clearSensorLog").addEventListener("click", () => {
    sensorLogEntries = [];
    renderSensorLog();
});

function addFeedingEvent(status) {
    if (status !== "ON" && status !== "OFF") return;
    const now = new Date();
    feedCount++;
    document.getElementById("sumFeedCount").textContent = feedCount;
    feedingHistory.unshift({ id: feedCount, status, date: now });
    renderFeedingHistory();
}

function renderFeedingHistory() {
    const tbody = document.getElementById("feedingHistoryBody");
    if (feedingHistory.length === 0) {
        tbody.innerHTML = `<tr id="noFeedingRow"><td colspan="5" style="text-align:center;color:#aaa;padding:30px;">No feeding events recorded yet.</td></tr>`;
        return;
    }
    tbody.innerHTML = feedingHistory.map(e => {
        const statusHtml = e.status === "ON"
            ? `<span class="status active"><i class="fas fa-check-circle"></i> Activated</span>`
            : `<span class="status cancelled"><i class="fas fa-times-circle"></i> Deactivated</span>`;
        return `<tr>
            <td>#FEED-${String(e.id).padStart(3,"0")}</td>
            <td>Servo ${e.status}</td>
            <td>${e.date.toLocaleDateString()}</td>
            <td>${e.date.toLocaleTimeString()}</td>
            <td>${statusHtml}</td>
        </tr>`;
    }).join("");
}

document.getElementById("clearFeedingHistory").addEventListener("click", () => {
    feedingHistory = [];
    feedCount = 0;
    document.getElementById("sumFeedCount").textContent = "0";
    renderFeedingHistory();
});

document.getElementById("saveProfileBtn").addEventListener("click", () => {
    const name = document.getElementById("profileName").value.trim() || "User";
    const initial = name.charAt(0).toUpperCase();

    document.getElementById("profileNameDisplay").textContent = name;
    document.getElementById("profileAvatarDisplay").textContent = initial;
    document.getElementById("headerName").textContent = name;
    document.getElementById("headerAvatar").textContent = initial;
    document.getElementById("profileAvatarDisplay").style.background = `linear-gradient(135deg, #8de4e2, #8dc2fe)`;

    showFeedback("profileFeedback", "Profile saved successfully!", "success");
});

setInterval(() => {
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    const str = h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
    document.getElementById("sumUptime").textContent = str;
}, 1000);

const navItems = document.querySelectorAll(".nav-item[data-page]");
const pages = document.querySelectorAll(".page");

navItems.forEach(item => {
    item.addEventListener("click", () => {
        navItems.forEach(n => n.classList.remove("active"));
        pages.forEach(p => p.classList.remove("active"));
        item.classList.add("active");
        const pageId = "page-" + item.getAttribute("data-page");
        const target = document.getElementById(pageId);
        if (target) {
            target.classList.add("active");
            target.style.animation = "none";
            target.offsetHeight;
            target.style.animation = "fadeInUp 0.4s ease";
        }
    });
});

document.getElementById("searchInput").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    if (!q) return;
    const pages = {
        "dashboard": ["dashboard", "humidity", "temperature", "water", "servo", "feeder"],
        "data-censors": ["sensor", "data", "censors", "log", "readings"],
        "device": ["device", "broker", "mqtt", "connect", "topic"],
        "user": ["user", "profile", "name", "email", "session"],
    };
    for (const [page, keywords] of Object.entries(pages)) {
        if (keywords.some(k => k.includes(q))) {
            const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
            if (nav) nav.click();
            break;
        }
    }
});

function setById(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = val;
}

function mapValue(x, in_min, in_max, out_min, out_max) {
    return Math.round((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min);
}

function timeStr() {
    return new Date().toLocaleTimeString();
}

function showFeedback(id, msg, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = `publish-feedback feedback-${type}`;
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 3500);
}