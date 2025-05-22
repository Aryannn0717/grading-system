import { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({
    name: '',
    semester: '',
    school_year: ''
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const { data, error } = await supabase.from('subjects').select('*');
    if (error) console.error('Error fetching subjects:', error);
    else setSubjects(data);
  };

  const handleAddSubject = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('subjects').insert([
      { ...newSubject, created_by: user.id }
    ]);
    
    if (error) {
      console.error('Error adding subject:', error);
    } else {
      setNewSubject({ name: '', semester: '', school_year: '' });
      fetchSubjects();
    }
  };

  const handleDeleteSubject = async (id) => {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) console.error('Error deleting subject:', error);
    else fetchSubjects();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Manage Subjects</h1>
      
      {/* Add Subject Form */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-3">Add New Subject</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Subject Name"
            value={newSubject.name}
            onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Semester"
            value={newSubject.semester}
            onChange={(e) => setNewSubject({...newSubject, semester: e.target.value})}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="School Year"
            value={newSubject.school_year}
            onChange={(e) => setNewSubject({...newSubject, school_year: e.target.value})}
            className="p-2 border rounded"
          />
          <button 
            onClick={handleAddSubject}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Add Subject
          </button>
        </div>
      </div>

      {/* Subjects List */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-3">Your Subjects</h2>
        {subjects.length === 0 ? (
          <p className="text-gray-500">No subjects added yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{subject.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{subject.semester}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{subject.school_year}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => handleDeleteSubject(subject.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
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