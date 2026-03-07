# AI-Based-IoT-Smart-Healthcare-Monitoring-and-Emergency-Alert-System-with-GPS-and-Cloud
AI-enabled IoT patient health monitoring system with cloud storage, real-time dashboard, AI prediction, and GPS emergency alerts.


📌 Project Overview

The Patient Health Monitoring & Emergency Alert System is an IoT-based healthcare device designed to continuously monitor a patient’s heart rate, blood oxygen level (SpO₂), and body temperature.

The system sends real-time health data to a web dashboard, allowing doctors or family members to monitor the patient remotely.

If abnormal health conditions are detected, the system triggers an emergency alert and sends the patient's GPS location for immediate assistance.

---

🎯 Problem Statement

In many rural and resource-limited healthcare settings, continuous monitoring of patients is difficult due to the high cost of medical equipment.

Patients with chronic diseases, elderly individuals living alone, or people recovering from surgery require constant monitoring to detect health problems early.

This project provides a low-cost IoT health monitoring system that continuously tracks vital signs and sends alerts during emergencies.

---

⚙️ Hardware Components

- ESP32
- MAX30102
- DS18B20 or LM35
- GPS Module (for emergency location tracking)
- Buzzer
- LED Indicator
- Jumper Wires
- Breadboard / Wearable device body
- Battery

---

💻 Software & Tools

- Arduino IDE
- GitHub
- Web Dashboard (HTML / IoT Platform)
- Database / Spreadsheet for storing patient data

---

🚀 Features

1️⃣ Heart Rate Monitoring

The system measures heartbeats per minute (BPM) continuously using the sensor.

2️⃣ SpO₂ Monitoring

The system measures blood oxygen saturation level, which helps detect breathing problems.

3️⃣ Body Temperature Monitoring

A temperature sensor continuously measures the patient’s body temperature.

4️⃣ Real-Time Web Dashboard

All health data is sent to a web dashboard where doctors or family members can monitor the patient in real time.

5️⃣ Emergency Alert System

If the health parameters exceed safe limits:

- Buzzer sounds
- Red LED flashes
- Alert message appears on dashboard

6️⃣ GPS Emergency Location

The system sends the patient’s real-time GPS location during emergencies so that medical help can reach quickly.

7️⃣ Data Logging

All health readings are stored with timestamps for medical analysis and patient history.

---
☁️ Cloud-Based Patient Record Storage

All patient health data such as heart rate, SpO₂ level, and body temperature are automatically stored in a secure cloud database.

This allows doctors and caregivers to:

- Access patient data from anywhere
- Review historical health records
- Monitor long-term health trends
- Provide better medical diagnosis

Cloud storage ensures that patient data is safe, organized, and easily accessible.

---

🤖 AI-Based Health Prediction

The system includes an AI-based health analysis module that analyzes the collected health data to detect abnormal patterns.

The AI system can:

- Predict possible health risks
- Detect unusual heart rate patterns
- Identify early signs of fever or oxygen level drop
- Provide warnings before a critical condition occurs

This helps doctors take preventive action earlier, improving patient safety.

---

📊 Normal Health Ranges

Parameter| Normal Range| Alert Condition
Heart Rate| 60–100 BPM| <50 or >120 BPM
Temperature| 36.5–37.5°C| >38.5°C
SpO₂| 95–100%| <90%

---

🔄 System Working

1. Sensors measure heart rate, SpO₂, and temperature.
2. ESP32 processes the sensor data.
3. Data is transmitted to the web dashboard via Wi-Fi.
4. If abnormal values are detected:
   - Buzzer activates
   - LED flashes
   - Emergency notification is sent.
5. The system also sends GPS location to help doctors or family members reach the patient quickly.

---

📈 Applications

- Remote patient monitoring
- Smart wearable healthcare devices
- Elderly care monitoring
- Rural healthcare systems
- Emergency health alert systems

---
