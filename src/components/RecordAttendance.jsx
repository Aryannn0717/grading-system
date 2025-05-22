// components/RecordAttendance.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { Calendar, Check, Clock, X, HelpCircle } from 'lucide-react';

export default function RecordAttendance() {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [existingRecords, setExistingRecords] = useState([]);

  // Fetch subjects and students
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [{ data: subjects }, { data: students }] = await Promise.all([
          supabase.from('subjects').select('*'),
          supabase.from('students').select('*')
        ]);
        
        setSubjects(subjects || []);
        setStudents(students || []);
        
        if (subjects?.length > 0) {
          setSelectedSubject(subjects[0].id);
        }

        // Initialize attendance records
        const initialRecords = {};
        students?.forEach(student => {
          initialRecords[student.id] = 'present';
        });
        setAttendanceRecords(initialRecords);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Check for existing attendance when subject or date changes
  useEffect(() => {
    if (!selectedSubject || !selectedDate) return;

    const fetchExistingAttendance = async () => {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('subject_id', selectedSubject)
        .eq('date', selectedDate);

      setExistingRecords(data || []);

      // If existing records found, update the attendance state
      if (data?.length > 0) {
        const records = {};
        data.forEach(record => {
          records[record.student_id] = record.status;
        });
        setAttendanceRecords(records);
      } else {
        // Reset to default 'present' if no records exist
        const initialRecords = {};
        students.forEach(student => {
          initialRecords[student.id] = 'present';
        });
        setAttendanceRecords(initialRecords);
      }
    };

    fetchExistingAttendance();
  }, [selectedSubject, selectedDate, students]);

  // Handle attendance status change
  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Submit attendance
  const handleSubmit = async () => {
    if (!selectedSubject || !selectedDate) {
      alert('Please select both subject and date');
      return;
    }

    setLoading(true);
    try {
      // Get current user (teacher)
      const { data: { user } } = await supabase.auth.getUser();

      // Prepare records
      const recordsToSubmit = students.map(student => ({
        student_id: student.id,
        subject_id: selectedSubject,
        date: selectedDate,
        status: attendanceRecords[student.id] || 'present',
        created_by: user.id
      }));

      // Delete existing records for this date/subject first
      await supabase
        .from('attendance')
        .delete()
        .eq('subject_id', selectedSubject)
        .eq('date', selectedDate);

      // Insert new records
      const { error } = await supabase
        .from('attendance')
        .insert(recordsToSubmit);

      if (error) throw error;

      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  // Status options with icons
  const statusOptions = [
    { value: 'present', label: 'Present', icon: <Check className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
    { value: 'absent', label: 'Absent', icon: <X className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
    { value: 'late', label: 'Late', icon: <Clock className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'excused', label: 'Excused', icon: <HelpCircle className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' }
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Record Attendance</h1>
      
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={loading || subjects.length === 0}
          >
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 w-full p-2 border rounded"
              disabled={loading}
            />
          </div>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Attendance'
            )}
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Student Attendance</h2>
          <p className="text-sm text-gray-600">
            {selectedDate} - {subjects.find(s => s.id === selectedSubject)?.name || 'No subject selected'}
          </p>
        </div>
        
        {loading && students.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map(student => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {student.photo_url && (
                          <img 
                            src={student.photo_url} 
                            alt={student.full_name}
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="font-medium">{student.full_name}</div>
                          <div className="text-sm text-gray-500">{student.student_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusOptions.find(s => s.value === attendanceRecords[student.id])?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {statusOptions.find(s => s.value === attendanceRecords[student.id])?.label || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-1">
                      {statusOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleStatusChange(student.id, option.value)}
                          className={`p-2 rounded-full ${
                            attendanceRecords[student.id] === option.value 
                              ? option.color.replace('100', '300') 
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          title={option.label}
                        >
                          {option.icon}
                        </button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}