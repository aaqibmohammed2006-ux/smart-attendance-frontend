import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8080/api' : '/api');

const blankStudent = {
  id: '',
  rollNumber: '',
  fullName: '',
  email: '',
  department: '',
  semester: ''
};

const blankSubject = {
  id: '',
  subjectCode: '',
  subjectName: '',
  department: '',
  semester: ''
};

const blankSession = {
  id: '',
  subjectId: '',
  sessionDate: '',
  startTime: '09:00',
  status: 'DRAFT'
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [reports, setReports] = useState(null);
  const [studentForm, setStudentForm] = useState(blankStudent);
  const [subjectForm, setSubjectForm] = useState(blankSubject);
  const [sessionForm, setSessionForm] = useState(blankSession);
  const [enrollmentForm, setEnrollmentForm] = useState({ studentId: '', subjectId: '' });
  const [studentSearch, setStudentSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [attendanceEntries, setAttendanceEntries] = useState([]);
  const [attendanceMessage, setAttendanceMessage] = useState('');
  const [attendanceError, setAttendanceError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [dashboardRes, studentsRes, subjectsRes, sessionsRes, enrollmentsRes, reportsRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard`),
        axios.get(`${API_URL}/students`),
        axios.get(`${API_URL}/subjects`),
        axios.get(`${API_URL}/sessions`),
        axios.get(`${API_URL}/enrollments`),
        axios.get(`${API_URL}/reports`)
      ]);

      setDashboard(dashboardRes.data);
      setStudents(studentsRes.data);
      setSubjects(subjectsRes.data);
      setSessions(sessionsRes.data);
      setEnrollments(enrollmentsRes.data);
      setReports(reportsRes.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Unable to load data from the backend. Make sure the Spring Boot API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(String(subjects[0].id));
    }
  }, [subjects, selectedSubjectId]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesQuery = !studentSearch || `${student.fullName} ${student.rollNumber}`.toLowerCase().includes(studentSearch.toLowerCase());
      return matchesQuery;
    });
  }, [students, studentSearch]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const matchesQuery = !subjectSearch || `${subject.subjectName} ${subject.subjectCode}`.toLowerCase().includes(subjectSearch.toLowerCase());
      return matchesQuery;
    });
  }, [subjects, subjectSearch]);

  useEffect(() => {
    if (!selectedSubjectId) return;
    const relevantSessions = sessions.filter((session) => String(session.subjectId) === String(selectedSubjectId));
    if (relevantSessions.length > 0) {
      setSelectedSessionId((currentId) => currentId && relevantSessions.some((s) => String(s.id) === String(currentId)) ? currentId : String(relevantSessions[0].id));
    } else {
      setSelectedSessionId('');
    }
  }, [selectedSubjectId, sessions]);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!selectedSessionId) {
        setAttendanceEntries([]);
        return;
      }
      try {
        const [eligibleRes, existingRes] = await Promise.all([
          axios.get(`${API_URL}/attendance/session/${selectedSessionId}/eligible-students`),
          axios.get(`${API_URL}/attendance/session/${selectedSessionId}`)
        ]);

        const existingMap = {};
        (existingRes.data || []).forEach((entry) => {
          existingMap[entry.studentId] = entry.status;
        });

        const prepared = (eligibleRes.data || []).map((student) => ({
          studentId: student.studentId,
          fullName: student.fullName,
          rollNumber: student.rollNumber,
          status: existingMap[student.studentId] || 'PRESENT'
        }));
        setAttendanceEntries(prepared);
        setAttendanceError('');
      } catch (err) {
        console.error(err);
        setAttendanceEntries([]);
        setAttendanceError(err.response?.data?.message || 'Unable to load attendance for this session.');
      }
    };

    loadAttendance();
  }, [selectedSessionId]);

  const handleStudentSave = async (event) => {
    event.preventDefault();
    try {
      if (studentForm.id) {
        await axios.put(`${API_URL}/students/${studentForm.id}`, studentForm);
      } else {
        await axios.post(`${API_URL}/students`, studentForm);
      }
      setStudentForm(blankStudent);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Student save failed.');
    }
  };

  const handleSubjectSave = async (event) => {
    event.preventDefault();
    try {
      if (subjectForm.id) {
        await axios.put(`${API_URL}/subjects/${subjectForm.id}`, subjectForm);
      } else {
        await axios.post(`${API_URL}/subjects`, subjectForm);
      }
      setSubjectForm(blankSubject);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Subject save failed.');
    }
  };

  const handleSessionSave = async (event) => {
    event.preventDefault();
    try {
      if (sessionForm.id) {
        await axios.put(`${API_URL}/sessions/${sessionForm.id}`, sessionForm);
      } else {
        await axios.post(`${API_URL}/sessions`, sessionForm);
      }
      setSessionForm(blankSession);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Session save failed.');
    }
  };

  const handleEnrollmentSave = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${API_URL}/enrollments`, enrollmentForm);
      setEnrollmentForm({ studentId: '', subjectId: '' });
      fetchAll();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Enrollment failed.');
    }
  };

  const handleDeleteStudent = async (id) => {
    try {
      await axios.delete(`${API_URL}/students/${id}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      await axios.delete(`${API_URL}/subjects/${id}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleDeleteEnrollment = async (id) => {
    try {
      await axios.delete(`${API_URL}/enrollments/${id}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleDeleteSession = async (id) => {
    try {
      await axios.delete(`${API_URL}/sessions/${id}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const finalizeSession = async (id) => {
    try {
      await axios.put(`${API_URL}/sessions/${id}/finalize`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Finalization failed.');
    }
  };

  const saveAttendance = async () => {
    try {
      const payload = attendanceEntries.map((entry) => ({
        studentId: entry.studentId,
        status: entry.status
      }));

      const response = await axios.post(`${API_URL}/attendance/session/${selectedSessionId}`, payload);
      setAttendanceMessage(response.data.message || 'Attendance saved successfully.');
      setAttendanceError('');
      fetchAll();
    } catch (err) {
      console.error(err);
      setAttendanceError(err.response?.data?.message || 'Attendance submit failed.');
    }
  };

  const markAllPresent = () => {
    setAttendanceEntries((current) => current.map((entry) => ({ ...entry, status: 'PRESENT' })));
  };

  const setAttendanceStatus = (studentId, value) => {
    setAttendanceEntries((current) => current.map((entry) => (
      entry.studentId === studentId ? { ...entry, status: value } : entry
    )));
  };

  const cardClass = 'stat-card';
  const selectedSession = sessions.find((session) => String(session.id) === String(selectedSessionId));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Smart Attendance</h1>
        <nav>
          {[
            ['dashboard', 'Dashboard'],
            ['students', 'Students'],
            ['subjects', 'Subjects'],
            ['enrollments', 'Enrollments'],
            ['sessions', 'Sessions'],
            ['attendance', 'Attendance'],
            ['reports', 'Reports']
          ].map(([key, label]) => (
            <button
              key={key}
              className={activeTab === key ? 'nav-button active' : 'nav-button'}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        {loading ? <div className="loader">Loading attendance data...</div> : null}
        {error ? <div className="message error">{error}</div> : null}

        {activeTab === 'dashboard' && dashboard ? (
          <section>
            <h2>Dashboard</h2>
            <div className="stats-grid">
              <div className={cardClass}><span>Total Students</span><strong>{dashboard.totalStudents}</strong></div>
              <div className={cardClass}><span>Total Subjects</span><strong>{dashboard.totalSubjects}</strong></div>
              <div className={cardClass}><span>Finalized Sessions</span><strong>{dashboard.totalFinalizedSessions}</strong></div>
              <div className={cardClass}><span>Today Attendance</span><strong>{dashboard.todayPresent} / {dashboard.todayPresent + dashboard.todayAbsent}</strong></div>
              <div className={cardClass}><span>Overall Attendance</span><strong>{dashboard.overallAttendancePercentage}%</strong></div>
            </div>

            <div className="panel-grid">
              <div className="panel">
                <h3>Low Attendance Students</h3>
                {dashboard.lowAttendanceStudents.length === 0 ? <p>No students below 75%.</p> : (
                  <ul className="list-block">
                    {dashboard.lowAttendanceStudents.map((student) => (
                      <li key={student.studentId}>
                        <strong>{student.studentName}</strong> ({student.rollNumber})
                        <span>{student.attendancePercentage}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="panel">
                <h3>Recent Sessions</h3>
                {dashboard.recentSessions.length === 0 ? <p>No recent session records.</p> : (
                  <ul className="list-block">
                    {dashboard.recentSessions.map((session) => (
                      <li key={session.id}>
                        <strong>{session.subjectName}</strong>
                        <span>{session.sessionDate} · {session.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="panel">
              <h3>Subject-wise Attendance</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Code</th>
                      <th>Classes</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.subjectSummary.map((item) => (
                      <tr key={item.subjectId}>
                        <td>{item.subjectName}</td>
                        <td>{item.subjectCode}</td>
                        <td>{item.classesAttended}/{item.totalClasses}</td>
                        <td>{item.attendancePercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'students' && (
          <section>
            <h2>Student Management</h2>
            <form className="form-grid" onSubmit={handleStudentSave}>
              <input type="text" placeholder="Roll Number" value={studentForm.rollNumber} onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })} required />
              <input type="text" placeholder="Full Name" value={studentForm.fullName} onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })} required />
              <input type="email" placeholder="Email" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} required />
              <input type="text" placeholder="Department" value={studentForm.department} onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })} required />
              <input type="text" placeholder="Semester" value={studentForm.semester} onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })} required />
              <button type="submit">{studentForm.id ? 'Update Student' : 'Add Student'}</button>
              {studentForm.id ? <button type="button" className="secondary" onClick={() => setStudentForm(blankStudent)}>Cancel</button> : null}
            </form>

            <div className="toolbar">
              <input type="text" placeholder="Search student by name or roll number" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Roll</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>{student.rollNumber}</td>
                      <td>{student.fullName}</td>
                      <td>{student.email}</td>
                      <td>{student.department}</td>
                      <td>{student.semester}</td>
                      <td>
                        <button className="link-btn" onClick={() => setStudentForm(student)}>Edit</button>
                        <button className="link-btn danger" onClick={() => handleDeleteStudent(student.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'subjects' && (
          <section>
            <h2>Subject Management</h2>
            <form className="form-grid" onSubmit={handleSubjectSave}>
              <input type="text" placeholder="Subject Code" value={subjectForm.subjectCode} onChange={(e) => setSubjectForm({ ...subjectForm, subjectCode: e.target.value })} required />
              <input type="text" placeholder="Subject Name" value={subjectForm.subjectName} onChange={(e) => setSubjectForm({ ...subjectForm, subjectName: e.target.value })} required />
              <input type="text" placeholder="Department" value={subjectForm.department} onChange={(e) => setSubjectForm({ ...subjectForm, department: e.target.value })} required />
              <input type="text" placeholder="Semester" value={subjectForm.semester} onChange={(e) => setSubjectForm({ ...subjectForm, semester: e.target.value })} required />
              <button type="submit">{subjectForm.id ? 'Update Subject' : 'Add Subject'}</button>
              {subjectForm.id ? <button type="button" className="secondary" onClick={() => setSubjectForm(blankSubject)}>Cancel</button> : null}
            </form>

            <div className="toolbar">
              <input type="text" placeholder="Search subject by name or code" value={subjectSearch} onChange={(e) => setSubjectSearch(e.target.value)} />
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Subject</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((subject) => (
                    <tr key={subject.id}>
                      <td>{subject.subjectCode}</td>
                      <td>{subject.subjectName}</td>
                      <td>{subject.department}</td>
                      <td>{subject.semester}</td>
                      <td>
                        <button className="link-btn" onClick={() => setSubjectForm(subject)}>Edit</button>
                        <button className="link-btn danger" onClick={() => handleDeleteSubject(subject.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'enrollments' && (
          <section>
            <h2>Student Enrollment</h2>
            <form className="form-grid" onSubmit={handleEnrollmentSave}>
              <select value={enrollmentForm.studentId} onChange={(e) => setEnrollmentForm({ ...enrollmentForm, studentId: e.target.value })} required>
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.fullName} ({student.rollNumber})</option>
                ))}
              </select>

              <select value={enrollmentForm.subjectId} onChange={(e) => setEnrollmentForm({ ...enrollmentForm, subjectId: e.target.value })} required>
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.subjectName}</option>
                ))}
              </select>

              <button type="submit">Enroll Student</button>
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll</th>
                    <th>Subject</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.studentName}</td>
                      <td>{entry.rollNumber}</td>
                      <td>{entry.subjectName}</td>
                      <td><button className="link-btn danger" onClick={() => handleDeleteEnrollment(entry.id)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'sessions' && (
          <section>
            <h2>Class Session Management</h2>
            <form className="form-grid" onSubmit={handleSessionSave}>
              <select value={sessionForm.subjectId} onChange={(e) => setSessionForm({ ...sessionForm, subjectId: e.target.value })} required>
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.subjectCode} - {subject.subjectName}</option>
                ))}
              </select>
              <input type="date" value={sessionForm.sessionDate} onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })} required />
              <input type="time" value={sessionForm.startTime} onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })} />
              {sessionForm.id ? (
                <select value={sessionForm.status} onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value })}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              ) : null}
              <button type="submit">{sessionForm.id ? 'Update Session' : 'Add Session'}</button>
              {sessionForm.id ? <button type="button" className="secondary" onClick={() => setSessionForm(blankSession)}>Cancel</button> : null}
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>{session.subjectName}</td>
                      <td>{session.sessionDate}</td>
                      <td>{session.startTime || '—'}</td>
                      <td>{session.status}</td>
                      <td>
                        {session.status === 'FINALIZED' ? (
                          <button className="link-btn" onClick={() => axios.put(`${API_URL}/sessions/${session.id}/reopen`).then(fetchAll).catch((err) => alert(err.response?.data?.message || 'Reopen failed.'))}>Reopen</button>
                        ) : (
                          <>
                            <button className="link-btn" onClick={() => setSessionForm({ ...session, subjectId: session.subjectId })}>Edit</button>
                            {session.status === 'DRAFT' ? <button className="link-btn" onClick={() => finalizeSession(session.id)}>Finalize</button> : null}
                            <button className="link-btn danger" onClick={() => handleDeleteSession(session.id)}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'attendance' && (
          <section>
            <h2>Mark Attendance</h2>
            <div className="form-grid">
              <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)}>
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.subjectName}</option>
                ))}
              </select>

              <select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)}>
                <option value="">Select Session</option>
                {sessions.filter((session) => String(session.subjectId) === String(selectedSubjectId)).map((session) => (
                  <option key={session.id} value={session.id}>{session.sessionDate} - {session.status}</option>
                ))}
              </select>
            </div>

            {selectedSessionId && attendanceEntries.length > 0 ? (
              <>
                {selectedSession?.status === 'DRAFT' ? (
                  <div className="toolbar">
                    <button type="button" onClick={markAllPresent}>Mark All Present</button>
                    <button type="button" className="secondary" onClick={saveAttendance}>Save Attendance</button>
                  </div>
                ) : <div className="message">{selectedSession?.status === 'FINALIZED' ? 'Finalized session is read-only. Reopen it to make attendance corrections.' : 'Cancelled session is read-only.'}</div>}
                {attendanceMessage ? <div className="message success">{attendanceMessage}</div> : null}
                {attendanceError ? <div className="message error">{attendanceError}</div> : null}

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Roll</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceEntries.map((entry) => (
                        <tr key={entry.studentId}>
                          <td>{entry.fullName}</td>
                          <td>{entry.rollNumber}</td>
                          <td>
                            <select value={entry.status} onChange={(e) => setAttendanceStatus(entry.studentId, e.target.value)}>
                              <option value="PRESENT">PRESENT</option>
                              <option value="ABSENT">ABSENT</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p>Select a subject and session to mark attendance.</p>
            )}
          </section>
        )}

        {activeTab === 'reports' && reports ? (
          <section>
            <h2>Attendance Reports</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Classes Attended</th>
                    <th>Total Classes</th>
                    <th>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.studentReports.map((student) => (
                    <tr key={student.studentId}>
                      <td>{student.studentName} ({student.rollNumber})</td>
                      <td>{student.department}</td>
                      <td>{student.semester}</td>
                      <td>{student.classesAttended}</td>
                      <td>{student.totalClasses}</td>
                      <td>{student.attendancePercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default App;
