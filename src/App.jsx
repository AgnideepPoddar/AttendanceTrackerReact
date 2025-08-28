import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ⬇️ Replace with your own Supabase credentials
const supabase = createClient(
  "https://slpgrbpexudmpngnfudb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNscGdyYnBleHVkbXBuZ25mdWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTUyNTYsImV4cCI6MjA3MTc3MTI1Nn0.sMMZPEVGvFcBOtQTdYocWNwtTVb57KjR2zI1Fg1XSuI"
);

// ✅ Generate weekdays for 26 Aug – 24 Sep 2025
function getCustomDates() {
  const dates = [];
  const start = new Date("2025-08-26");
  const end = new Date("2025-09-24");

  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay(); // 0=Sun, 6=Sat
    if (day !== 0 && day !== 6) {
      dates.push(new Date(d));
    }
  }
  return dates;
}

export default function App() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [newName, setNewName] = useState("");
  const weekdays = getCustomDates();

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    const { data: sData, error: sError } = await supabase
      .from("students")
      .select("*")
      .order("id");

    if (sError) {
      console.error("Error fetching students:", sError.message);
      return;
    }

    const { data: aData, error: aError } = await supabase
      .from("attendance")
      .select("*");

    if (aError) {
      console.error("Error fetching attendance:", aError.message);
      return;
    }

    const attMap = {};
    aData.forEach((row) => {
      if (!attMap[row.student_id]) attMap[row.student_id] = {};
      attMap[row.student_id][row.date] = row.status;
    });

    setStudents(sData);
    setAttendance(attMap);
  }

  async function addStudent() {
    if (!newName.trim()) return;
    const { data, error } = await supabase
      .from("students")
      .insert([{ name: newName }])
      .select();

    if (error) {
      console.error("Error adding student:", error.message);
    } else {
      setStudents([...students, data[0]]);
      setNewName("");
    }
  }

  async function toggleAttendance(studentId, date) {
    // 🚫 Block future dates
    const today = new Date().toISOString().split("T")[0];
    if (date > today) {
      alert("❌ You cannot modify attendance for future dates.");
      return;
    }

    const currentStatus = attendance[studentId]?.[date] || "neutral";
    let newStatus = currentStatus;

    if (currentStatus === "neutral") {
      // First time marking → ask P or A
      const choice = window.prompt("Mark attendance (P = Present, A = Absent):");
      if (!choice) return;
      if (choice.toLowerCase() === "p") newStatus = "present";
      else if (choice.toLowerCase() === "a") newStatus = "absent";
      else return;
    } else if (currentStatus === "present") {
      // Confirm before making absent
      const confirmAbs = window.confirm(
        "This student is marked Present. Do you want to change to Absent?"
      );
      if (confirmAbs) newStatus = "absent";
      else return;
    } else if (currentStatus === "absent") {
      // Toggle back to present directly
      newStatus = "present";
    }

    // Save to Supabase
    const { error } = await supabase
      .from("attendance")
      .upsert([{ student_id: studentId, date, status: newStatus }], {
        onConflict: "student_id,date",
      });

    if (error) {
      console.error("Error updating attendance:", error.message);
    } else {
      setAttendance((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [date]: newStatus,
        },
      }));
    }
  }

  function getCellDisplay(status) {
    if (status === "present") return "✅";
    if (status === "absent") return "❌";
    return "⚪"; // neutral
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>📋 Attendance Tracker (26 Aug – 24 Sep 2025)</h1>

      {/* Add Student */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter student name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button onClick={addStudent}>➕ Add Student</button>
      </div>

      {/* Attendance Table */}
      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Student</th>
            {weekdays.map((d) => (
              <th key={d.toISOString().split("T")[0]}>
                {d.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              {weekdays.map((d) => {
                const dateStr = d.toISOString().split("T")[0];
                const status = attendance[s.id]?.[dateStr] || "neutral";
                const today = new Date().toISOString().split("T")[0];
                const isFuture = dateStr > today;

                return (
                  <td
                    key={dateStr}
                    onClick={() =>
                      !isFuture && toggleAttendance(s.id, dateStr)
                    }
                    style={{
                      cursor: isFuture ? "not-allowed" : "pointer",
                      backgroundColor:
                        status === "present"
                          ? "lightgreen"
                          : status === "absent"
                          ? "#fbb"
                          : "#ddd",
                      opacity: isFuture ? 0.5 : 1, // make future dates look disabled
                    }}
                  >
                    {getCellDisplay(status)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
