// components/GradeManagement.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

export default function GradeManagement() {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch data on mount
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
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fetch grades when subject changes
  useEffect(() => {
    if (!selectedSubject) return;
    
    const fetchGrades = async () => {
      const { data } = await supabase
        .from('grades')
        .select('*')
        .eq('subject_id', selectedSubject);
      
      setGrades(data || []);
    };
    
    fetchGrades();
  }, [selectedSubject]);

  // Calculate cumulative grade
  const calculateCumulative = (studentGrades) => {
    if (!studentGrades) return {};
    
    const prelim = studentGrades.prelim;
    const midterm = studentGrades.midterm ? (prelim + studentGrades.midterm) / 2 : prelim;
    const semiFinal = studentGrades.semi_final ? (midterm + studentGrades.semi_final) / 2 : midterm;
    const final = studentGrades.final ? (semiFinal + studentGrades.final) / 2 : semiFinal;
    
    return {
      prelim,
      midterm,
      semiFinal,
      final,
      status: final >= 3.0 ? 'Failed' : 'Passed'
    };
  };

  // Handle grade change
  const handleGradeChange = async (studentId, term, value) => {
    // Validate grade (1.0 to 5.0)
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue < 1.0 || numericValue > 5.0) {
      alert('Please enter a valid grade between 1.0 and 5.0');
      return;
    }

    // Get current user (teacher)
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // Check if grade record exists
      const existingGrade = grades.find(g => 
        g.student_id === studentId && g.subject_id === selectedSubject
      );

      if (existingGrade) {
        // Update existing grade
        const { error } = await supabase
          .from('grades')
          .update({ 
            [term]: numericValue,
            updated_at: new Date().toISOString(),
            updated_by: user.id
          })
          .eq('id', existingGrade.id);
        
        if (error) throw error;
      } else {
        // Create new grade record
        const newGrade = {
          student_id: studentId,
          subject_id: selectedSubject,
          [term]: numericValue,
          created_by: user.id
        };
        
        const { error } = await supabase.from('grades').insert([newGrade]);
        if (error) throw error;
      }

      // Refresh grades
      const { data } = await supabase
        .from('grades')
        .select('*')
        .eq('subject_id', selectedSubject);
      
      setGrades(data || []);
    } catch (error) {
      console.error('Error saving grade:', error);
      alert('Failed to save grade');
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Grade Management</h1>
      
      {/* Subject Selection */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <label className="block text-sm font-medium mb-2">Select Subject</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={loading}
        >
          {subjects.map(subject => (
            <option key={subject.id} value={subject.id}>
              {subject.name} - {subject.semester} {subject.school_year}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Raw Grades Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Raw Grades</h2>
              <p className="text-sm text-gray-600">Enter grades for each term (1.0 - 5.0 scale)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prelim</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Midterm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semi-Final</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map(student => {
                    const studentGrades = grades.find(g => g.student_id === student.id) || {};
                    return (
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
                        {['prelim', 'midterm', 'semi_final', 'final'].map(term => (
                          <td key={term} className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="1.0"
                              max="5.0"
                              step="0.1"
                              value={studentGrades[term] || ''}
                              onChange={(e) => handleGradeChange(student.id, term, e.target.value)}
                              className={`w-20 p-1 border rounded ${
                                studentGrades[term] >= 3.0 ? 'bg-red-100 border-red-300' : 'bg-white'
                              }`}
                              placeholder="0.0"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cumulative Grades Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Cumulative Grades</h2>
              <p className="text-sm text-gray-600">Automatically calculated based on raw grades</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prelim</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Midterm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semi-Final</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map(student => {
                    const studentGrades = grades.find(g => g.student_id === student.id) || {};
                    const cumulative = calculateCumulative(studentGrades);
                    
                    return (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium">{student.full_name}</div>
                        </td>
                        {['prelim', 'midterm', 'semiFinal', 'final'].map(term => (
                          <td 
                            key={term} 
                            className={`px-6 py-4 whitespace-nowrap ${
                              cumulative[term] >= 3.0 ? 'text-red-600 font-bold' : ''
                            }`}
                          >
                            {cumulative[term]?.toFixed(2) || '-'}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            cumulative.status === 'Failed' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {cumulative.status || '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}