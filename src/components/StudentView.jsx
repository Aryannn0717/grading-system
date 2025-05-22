// components/StudentView.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { User, BookOpen, Calendar, Award, Clock, X, Check, HelpCircle } from 'lucide-react';

export default function StudentView({ session }) {
  const [studentData, setStudentData] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [activeTab, setActiveTab] = useState('attendance');
  const [loading, setLoading] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // Get student profile
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (!student) throw new Error('Student record not found');
        
        setStudentData(student);

        // Get attendance records
        const { data: attendance } = await supabase
          .from('attendance')
          .select('*, subjects(name)')
          .eq('student_id', student.id)
          .order('date', { ascending: false });

        setAttendance(attendance || []);

        // Get grades
        const { data: grades } = await supabase
          .from('grades')
          .select('*, subjects(name)')
          .eq('student_id', student.id);

        setGrades(grades || []);
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [session.user.id]);

  // Handle photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !studentData) return;

    try {
      setPhotoUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentData.id}-${Math.random()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('student-photos')
        .getPublicUrl(fileName);

      // Update student record
      const { error: updateError } = await supabase
        .from('students')
        .update({ photo_url: publicUrl })
        .eq('id', studentData.id);

      if (updateError) throw updateError;

      // Update local state
      setStudentData({ ...studentData, photo_url: publicUrl });
    } catch (error) {
      alert('Photo upload failed: ' + error.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  // Calculate cumulative grade
  const calculateCumulative = (grade) => {
    if (!grade) return null;
    
    const prelim = grade.prelim || 0;
    const midterm = grade.midterm ? (prelim + grade.midterm) / 2 : prelim;
    const semiFinal = grade.semi_final ? (midterm + grade.semi_final) / 2 : midterm;
    const final = grade.final ? (semiFinal + grade.final) / 2 : semiFinal;
    
    return {
      prelim: prelim.toFixed(1),
      midterm: midterm.toFixed(1),
      semiFinal: semiFinal.toFixed(1),
      final: final.toFixed(1),
      status: final >= 3.0 ? 'Failed' : 'Passed'
    };
  };

  // Status icon component
  const StatusIcon = ({ status }) => {
    const icons = {
      present: <Check className="h-4 w-4 text-green-500" />,
      absent: <X className="h-4 w-4 text-red-500" />,
      late: <Clock className="h-4 w-4 text-yellow-500" />,
      excused: <HelpCircle className="h-4 w-4 text-blue-500" />
    };
    
    return icons[status] || null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Student record not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-16">
      {/* Profile Header */}
      <div className="bg-white p-4 shadow">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {studentData.photo_url ? (
              <img 
                src={studentData.photo_url} 
                alt={studentData.full_name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={photoUploading}
              />
              {photoUploading ? (
                <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              )}
            </label>
          </div>
          <div>
            <h1 className="text-xl font-bold">{studentData.full_name}</h1>
            <p className="text-gray-600">{studentData.student_id}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b sticky top-0 bg-white z-10">
        <button
          className={`flex-1 py-3 px-4 text-center font-medium flex items-center justify-center space-x-2 ${
            activeTab === 'attendance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('attendance')}
        >
          <Calendar className="h-5 w-5" />
          <span>Attendance</span>
        </button>
        <button
          className={`flex-1 py-3 px-4 text-center font-medium flex items-center justify-center space-x-2 ${
            activeTab === 'grades' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('grades')}
        >
          <Award className="h-5 w-5" />
          <span>Grades</span>
        </button>
      </div>

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="divide-y">
          {attendance.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No attendance records found
            </div>
          ) : (
            attendance.map((record) => (
              <div key={record.id} className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{record.subjects?.name || 'Unknown Subject'}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(record.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusIcon status={record.status} />
                  <span className="capitalize">{record.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Grades Tab */}
      {activeTab === 'grades' && (
        <div className="divide-y">
          {grades.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No grade records found
            </div>
          ) : (
            grades.map((grade) => {
              const cumulative = calculateCumulative(grade);
              return (
                <div key={`${grade.subject_id}-${grade.student_id}`} className="p-4">
                  <h3 className="font-medium flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
                    {grade.subjects?.name || 'Unknown Subject'}
                  </h3>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className="text-xs font-medium text-gray-500">Raw Grades</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-xs text-gray-500">Prelim</p>
                          <p className={`font-medium ${grade.prelim >= 3.0 ? 'text-red-500' : ''}`}>
                            {grade.prelim?.toFixed(1) || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Midterm</p>
                          <p className={`font-medium ${grade.midterm >= 3.0 ? 'text-red-500' : ''}`}>
                            {grade.midterm?.toFixed(1) || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Semi-Final</p>
                          <p className={`font-medium ${grade.semi_final >= 3.0 ? 'text-red-500' : ''}`}>
                            {grade.semi_final?.toFixed(1) || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Final</p>
                          <p className={`font-medium ${grade.final >= 3.0 ? 'text-red-500' : ''}`}>
                            {grade.final?.toFixed(1) || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded">
                      <h4 className="text-xs font-medium text-blue-500">Cumulative</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-xs text-blue-500">Prelim</p>
                          <p className="font-medium">{cumulative.prelim}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-500">Midterm</p>
                          <p className="font-medium">{cumulative.midterm}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-500">Semi-Final</p>
                          <p className="font-medium">{cumulative.semiFinal}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-500">Final</p>
                          <p className={`font-medium ${
                            cumulative.status === 'Failed' ? 'text-red-500' : 'text-green-500'
                          }`}>
                            {cumulative.final} ({cumulative.status})
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}