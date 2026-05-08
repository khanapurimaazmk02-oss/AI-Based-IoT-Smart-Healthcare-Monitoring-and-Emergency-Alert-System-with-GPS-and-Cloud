// sendNotification.js
// ─────────────────────────────────────────────────────────────────────────────
// Server-side Node.js script — two modes:
//
//   MODE 1 — Manual one-shot send:
//     node sendNotification.js [userId]
//
//   MODE 2 — Auto-watch (RECOMMENDED — run this on your server continuously):
//     node sendNotification.js --watch
//     Keeps running and fires FCM push whenever any user's vitals go critical.
//     The frontend writes to: criticalAlerts/{uid}/latest
//     This script watches that path and notifies ALL registered devices.
// ─────────────────────────────────────────────────────────────────────────────

const admin = require("firebase-admin");

// ── Init ───────────────────────────────────────────────────────────────────
const serviceAccount = require("./iot-patient-health-monit-c67f6-firebase-adminsdk-fbsvc-d9c1c4bbcd.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://iot-patient-health-monit-c67f6-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

// ── Build FCM message ──────────────────────────────────────────────────────
function buildMessage(token, title, body, data = {}) {
    return {
        notification: { title, body },
        android: {
            priority: "high",
            notification: {
                sound: "default",
                channelId: "medimonitor_alerts",
                priority: "max",
                visibility: "public"
            }
        },
        apns: {
            payload: {
                aps: {
                    sound: "default",
                    badge: 1,
                    "content-available": 1,
                    "interruption-level": "critical"
                }
            }
        },
        webpush: {
            headers: { Urgency: "high" },
            notification: {
                icon: "/icon-192.png",
                badge: "/badge-72.png",
                vibrate: [300, 100, 300, 100, 300],
                requireInteraction: true
            },
            fcmOptions: { link: "/" },
            data: { ...data, click_action: "/" }
        },
        token
    };
}

// ── Send to single token ───────────────────────────────────────────────────
async function sendToToken(token, title, body, data = {}) {
    try {
        const response = await admin.messaging().send(buildMessage(token, title, body, data));
        console.log(`  ✅ Sent | messageId: ${response}`);
        return true;
    } catch (error) {
        if (error.code === "messaging/registration-token-not-registered") {
            console.warn(`  ⚠️  Token expired/invalid: ${token.slice(0, 20)}...`);
        } else {
            console.error(`  ❌ Error: ${error.message}`);
        }
        return false;
    }
}

// ── Get all FCM tokens from DB ─────────────────────────────────────────────
async function getFcmTokens(targetUid) {
    const snap = await db.ref("users").once("value");
    const users = snap.val();
    if (!users) { console.warn("No users found in database."); return []; }

    const tokens = [];
    for (const [uid, data] of Object.entries(users)) {
        if (targetUid && uid !== targetUid) continue;
        if (data.fcmToken) {
            tokens.push({ uid, token: data.fcmToken, name: data.name || uid });
        }
    }
    return tokens;
}

// ── Build alert message text from triggers ─────────────────────────────────
function buildAlertMessage(alertData) {
    const triggers = alertData.triggers || [];
    const vitals = alertData.vitals || {};
    const parts = [];

    if (triggers.includes("hr")) {
        const hr = vitals.heartRate;
        if (hr > 120) parts.push(`Heart Rate ${hr} BPM (TOO HIGH)`);
        else if (hr < 40) parts.push(`Heart Rate ${hr} BPM (TOO LOW)`);
        else parts.push(`Heart Rate ${hr} BPM (CRITICAL)`);
    }
    if (triggers.includes("spo2"))
        parts.push(`SpO2 ${vitals.spo2}% (CRITICALLY LOW)`);
    if (triggers.includes("temp"))
        parts.push(`Temperature ${Number(vitals.temperature).toFixed(1)} C (HIGH FEVER)`);

    return parts.length > 0
        ? parts.join(" | ")
        : "Patient vitals require immediate attention!";
}

// ─────────────────────────────────────────────────────────────────────────────
//  WATCH MODE  —  node sendNotification.js --watch
// ─────────────────────────────────────────────────────────────────────────────
const seenAlerts = new Set();

async function startWatchMode() {
    console.log("=========================================");
    console.log("  MediMonitor Critical Alert Watcher");
    console.log("  Listening: criticalAlerts/{uid}/latest");
    console.log("  Press Ctrl+C to stop.");
    console.log("=========================================\n");

    const critRef = db.ref("criticalAlerts");

    const handleAlert = async (userSnap) => {
        const uid = userSnap.key;
        const latestSnap = userSnap.child ? userSnap.child("latest") : null;

        let alertData = null;
        if (latestSnap && latestSnap.exists()) {
            alertData = latestSnap.val();
        } else if (userSnap.val && userSnap.val()?.latest) {
            alertData = userSnap.val().latest;
        }

        if (!alertData || !alertData.timestamp) return;
        if (alertData.acknowledged) return;
        if (alertData.fcmSent) return;

        // Skip alerts older than 90 seconds (avoids resending on startup)
        if (Date.now() - alertData.timestamp > 90000) return;

        // Deduplicate
        const alertKey = `${uid}:${alertData.timestamp}`;
        if (seenAlerts.has(alertKey)) return;
        seenAlerts.add(alertKey);

        const patName = alertData.patientName || "Patient";
        const title = `CRITICAL ALERT — ${patName}`;
        const body = buildAlertMessage(alertData);

        console.log(`\n CRITICAL ALERT`);
        console.log(`   UID      : ${uid}`);
        console.log(`   Patient  : ${patName}`);
        console.log(`   Triggers : ${(alertData.triggers || []).join(", ")}`);
        console.log(`   HR       : ${alertData.vitals?.heartRate} BPM`);
        console.log(`   SpO2     : ${alertData.vitals?.spo2} %`);
        console.log(`   Temp     : ${alertData.vitals?.temperature}`);
        console.log(`   Time     : ${new Date(alertData.timestamp).toLocaleString()}`);

        const targets = await getFcmTokens(null);   // notify ALL registered devices
        if (targets.length === 0) {
            console.warn("  No FCM tokens registered — no push sent.");
            return;
        }

        console.log(`\n  Sending FCM push to ${targets.length} device(s)...`);
        await Promise.all(
            targets.map(({ uid: tUid, token, name }) => {
                console.log(`    -> ${name} (${tUid.slice(0, 8)}...)`);
                return sendToToken(token, title, body, {
                    alertUid: uid,
                    timestamp: String(alertData.timestamp)
                });
            })
        );

        // Mark FCM sent in Firebase so we don't resend
        await db.ref(`criticalAlerts/${uid}/latest/fcmSent`).set(Date.now());
        console.log("  FCM push complete.\n");
    };

    critRef.on("child_changed", handleAlert);
    critRef.on("child_added", handleAlert);

    console.log("Ready — waiting for critical alerts...\n");
}

// ─────────────────────────────────────────────────────────────────────────────
//  MANUAL MODE  —  node sendNotification.js [uid]
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
    const targetUid = process.argv[2] || null;
    const title = process.env.NOTIFY_TITLE || "Medical Alert";
    const body = process.env.NOTIFY_BODY || "Patient vitals require immediate attention!";

    const targets = await getFcmTokens(targetUid);
    if (targets.length === 0) {
        console.warn(
            targetUid
                ? `No FCM token found for uid: ${targetUid}`
                : "No FCM tokens found. Users must log in with notifications enabled first."
        );
        process.exit(0);
    }

    console.log(`Sending "${title}" to ${targets.length} device(s)...`);
    await Promise.all(
        targets.map(({ uid, token, name }) => {
            console.log(`  -> ${name} (${uid.slice(0, 8)}...)`);
            return sendToToken(token, title, body);
        })
    );
    console.log("Done.");
    process.exit(0);
}

// ── Entry ──────────────────────────────────────────────────────────────────
if (process.argv[2] === "--watch") {
    startWatchMode();
    process.on("SIGINT", () => {
        console.log("\nWatch mode stopped.");
        process.exit(0);
    });
} else {
    main().catch((err) => {
        console.error("Fatal:", err);
        process.exit(1);
    });
}
